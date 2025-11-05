'use client';

import { useEffect, useState, useRef } from 'react';

interface SelectionOverlayProps {
  isEnabled: boolean;
}

interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * SelectionOverlay - Shows real-time blue highlight as user selects text
 * Similar to browser text selection behavior
 */
export default function SelectionOverlay({ isEnabled }: SelectionOverlayProps) {
  const [selectionRects, setSelectionRects] = useState<SelectionRect[]>([]);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isEnabled) {
      setSelectionRects([]);
      return;
    }

    let isSelecting = false;

    const updateSelectionHighlight = () => {
      const selection = window.getSelection();
      
      if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
        setSelectionRects([]);
        return;
      }

      const range = selection.getRangeAt(0);
      const container = range.commonAncestorContainer;
      
      // Check if selection is within PDF text layer
      const textLayerElement = (container as Element).closest?.('.react-pdf__Page__textContent');
      
      if (!textLayerElement) {
        setSelectionRects([]);
        return;
      }

      // Get all client rects for the selection (handles multi-line selections)
      const rects = Array.from(range.getClientRects());
      
      if (rects.length === 0) {
        setSelectionRects([]);
        return;
      }

      // Convert DOMRects to our SelectionRect format
      const selectionRectangles: SelectionRect[] = rects.map((rect) => ({
        left: rect.left + window.scrollX,
        top: rect.top + window.scrollY,
        width: rect.width,
        height: rect.height,
      }));

      setSelectionRects(selectionRectangles);
    };

    const handleMouseDown = (e: MouseEvent) => {
      // Check if mousedown is within PDF text layer
      const target = e.target as Element;
      const textLayerElement = target.closest?.('.react-pdf__Page__textContent');
      
      if (textLayerElement) {
        isSelecting = true;
        setSelectionRects([]); // Clear previous selection
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isSelecting) return;

      // Use requestAnimationFrame for smooth updates
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(() => {
        updateSelectionHighlight();
      });
    };

    const handleMouseUp = () => {
      isSelecting = false;
      
      // Keep the selection highlight visible until color picker is shown
      // The HighlightTool component will clear it when needed
      updateSelectionHighlight();
    };

    const handleSelectionChange = () => {
      // Handle selection changes from keyboard (Shift + Arrow keys)
      if (isSelecting) {
        updateSelectionHighlight();
      }
    };

    // Add event listeners
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('selectionchange', handleSelectionChange);

    return () => {
      // Cleanup
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('selectionchange', handleSelectionChange);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEnabled]);

  if (!isEnabled || selectionRects.length === 0) {
    return null;
  }

  return (
    <>
      {selectionRects.map((rect, index) => (
        <div
          key={index}
          className="fixed pointer-events-none z-[45]"
          style={{
            left: `${rect.left}px`,
            top: `${rect.top}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
            backgroundColor: 'rgba(59, 130, 246, 0.3)', // Blue with 30% opacity
            mixBlendMode: 'multiply',
            transition: 'all 0.05s ease-out',
          }}
        />
      ))}
    </>
  );
}

