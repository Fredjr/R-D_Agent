'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { TextSelection, AnnotationType } from '@/types/pdf-annotations';

interface TwoClickSelectorProps {
  isEnabled: boolean;
  selectedTool: AnnotationType | null;
  selectedColor: string;
  onSelectionComplete: (selection: TextSelection) => void;
}

interface ClickPoint {
  x: number;
  y: number;
  textNode: Node;
  offset: number;
}

/**
 * TwoClickSelector - Implements Cochrane Library-style two-click text selection
 * 
 * How it works:
 * 1. User clicks once to set start point
 * 2. User clicks again to set end point
 * 3. Automatically selects all text between the two points
 * 4. Works across multiple lines
 * 5. Shows pen cursor when active
 */
export default function TwoClickSelector({
  isEnabled,
  selectedTool,
  selectedColor,
  onSelectionComplete,
}: TwoClickSelectorProps) {
  const [firstClick, setFirstClick] = useState<ClickPoint | null>(null);
  const [previewRects, setPreviewRects] = useState<DOMRect[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
  const [showCursor, setShowCursor] = useState(false);

  // Check if tool is a text selection tool
  const isTextTool = selectedTool === 'highlight' || 
                     selectedTool === 'underline' || 
                     selectedTool === 'strikethrough';

  const shouldShowPenCursor = isEnabled && isTextTool;

  // Update cursor position on mouse move
  useEffect(() => {
    if (!shouldShowPenCursor) {
      setShowCursor(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      // Check if mouse is over PDF text layer
      const target = e.target as Element;
      const isOverPDF = target.closest('.react-pdf__Page__textContent') !== null;
      
      setShowCursor(isOverPDF);
      setCursorPosition({ x: e.clientX, y: e.clientY });

      // If we have a first click, show preview of selection
      if (firstClick && isOverPDF) {
        updatePreview(e);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [shouldShowPenCursor, firstClick]);

  // Update preview selection
  const updatePreview = useCallback((e: MouseEvent) => {
    if (!firstClick) return;

    try {
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!range) return;

      // Create a range from first click to current position
      const previewRange = document.createRange();
      
      // Determine order (forward or backward selection)
      const comparison = firstClick.textNode.compareDocumentPosition(range.startContainer);
      
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING || 
          (firstClick.textNode === range.startContainer && firstClick.offset <= range.startOffset)) {
        // Forward selection
        previewRange.setStart(firstClick.textNode, firstClick.offset);
        previewRange.setEnd(range.startContainer, range.startOffset);
      } else {
        // Backward selection
        previewRange.setStart(range.startContainer, range.startOffset);
        previewRange.setEnd(firstClick.textNode, firstClick.offset);
      }

      const rects = Array.from(previewRange.getClientRects());
      setPreviewRects(rects);
    } catch (error) {
      console.error('Error updating preview:', error);
    }
  }, [firstClick]);

  // Handle clicks
  useEffect(() => {
    if (!shouldShowPenCursor) {
      setFirstClick(null);
      setPreviewRects([]);
      return;
    }

    const handleClick = (e: MouseEvent) => {
      // Only handle clicks on PDF text layer
      const target = e.target as Element;
      const textLayer = target.closest('.react-pdf__Page__textContent');
      if (!textLayer) return;

      // Prevent default text selection behavior
      e.preventDefault();
      e.stopPropagation();

      // Get the text node and offset at click position
      const range = document.caretRangeFromPoint(e.clientX, e.clientY);
      if (!range) return;

      const clickPoint: ClickPoint = {
        x: e.clientX,
        y: e.clientY,
        textNode: range.startContainer,
        offset: range.startOffset,
      };

      if (!firstClick) {
        // First click - set start point
        console.log('🖱️ First click - setting start point');
        setFirstClick(clickPoint);
      } else {
        // Second click - complete selection
        console.log('🖱️ Second click - completing selection');
        completeSelection(firstClick, clickPoint);
        setFirstClick(null);
        setPreviewRects([]);
      }
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, [shouldShowPenCursor, firstClick]);

  // Complete the selection
  const completeSelection = (start: ClickPoint, end: ClickPoint) => {
    try {
      const range = document.createRange();
      
      // Determine order
      const comparison = start.textNode.compareDocumentPosition(end.textNode);
      
      if (comparison & Node.DOCUMENT_POSITION_FOLLOWING || 
          (start.textNode === end.textNode && start.offset <= end.offset)) {
        // Forward selection
        range.setStart(start.textNode, start.offset);
        range.setEnd(end.textNode, end.offset);
      } else {
        // Backward selection
        range.setStart(end.textNode, end.offset);
        range.setEnd(start.textNode, start.offset);
      }

      const selectedText = range.toString().trim();
      if (selectedText.length === 0) {
        console.log('⚠️ Empty selection, ignoring');
        return;
      }

      // Get page number
      const pageElement = (start.textNode as Element).closest?.('.react-pdf__Page');
      const pageNumberAttr = pageElement?.getAttribute('data-page-number');
      const pageNumber = pageNumberAttr ? parseInt(pageNumberAttr) : 1;

      // Get bounding rectangles
      const rects = Array.from(range.getClientRects());
      const boundingRect = range.getBoundingClientRect();

      console.log('✅ Selection complete:', selectedText.substring(0, 50));

      // Trigger callback
      onSelectionComplete({
        text: selectedText,
        pageNumber,
        boundingRect,
        rects,
      });

      // Clear the range
      range.detach();
    } catch (error) {
      console.error('Error completing selection:', error);
    }
  };

  // Convert hex color to rgba
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

  return (
    <>
      {/* Custom pen cursor */}
      {showCursor && shouldShowPenCursor && (
        <div
          className="fixed pointer-events-none z-[100]"
          style={{
            left: `${cursorPosition.x}px`,
            top: `${cursorPosition.y}px`,
            transform: 'translate(-4px, -4px)',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
              fill={selectedColor}
              stroke="white"
              strokeWidth="1"
            />
          </svg>
        </div>
      )}

      {/* Preview rectangles */}
      {previewRects.map((rect, index) => (
        <div
          key={index}
          className="fixed pointer-events-none z-[45]"
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: hexToRgba(selectedColor, 0.3),
            border: `1px dashed ${selectedColor}`,
            transition: 'all 0.05s ease-out',
          }}
        />
      ))}

      {/* First click indicator */}
      {firstClick && (
        <div
          className="fixed pointer-events-none z-[50]"
          style={{
            left: `${firstClick.x}px`,
            top: `${firstClick.y}px`,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div
            className="w-3 h-3 rounded-full animate-pulse"
            style={{
              backgroundColor: selectedColor,
              boxShadow: `0 0 0 4px ${hexToRgba(selectedColor, 0.3)}`,
            }}
          />
        </div>
      )}
    </>
  );
}

