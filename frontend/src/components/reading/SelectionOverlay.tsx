'use client';

import { useEffect, useState, useRef } from 'react';

interface SelectionOverlayProps {
  isEnabled: boolean;
  selectedColor?: string; // Color to use for real-time highlight
  onSelectionComplete?: (selection: {
    text: string;
    pageNumber: number;
    boundingRect: DOMRect;
    rects: DOMRect[];
  }) => void;
}

interface SelectionRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * SelectionOverlay - Shows real-time highlight as user selects text
 * Uses selected color for immediate visual feedback
 */
export default function SelectionOverlay({
  isEnabled,
  selectedColor = '#3B82F6', // Default to blue
  onSelectionComplete
}: SelectionOverlayProps) {
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

      // Update selection highlight one final time
      updateSelectionHighlight();

      // If onSelectionComplete callback is provided, trigger it
      if (onSelectionComplete) {
        const selection = window.getSelection();

        if (selection && !selection.isCollapsed && selection.rangeCount > 0) {
          const selectedText = selection.toString().trim();

          if (selectedText.length > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const textLayerElement = (container as Element).closest?.('.react-pdf__Page__textContent');

            if (textLayerElement) {
              // Get page number
              const pageElement = (container as Element).closest?.('.react-pdf__Page');
              const pageNumberAttr = pageElement?.getAttribute('data-page-number');
              const pageNumber = pageNumberAttr ? parseInt(pageNumberAttr) : 1;

              // Get bounding rectangles
              const rects = Array.from(range.getClientRects());
              const boundingRect = range.getBoundingClientRect();

              if (rects.length > 0) {
                // Trigger callback with selection data
                onSelectionComplete({
                  text: selectedText,
                  pageNumber,
                  boundingRect,
                  rects,
                });

                // Clear selection after a short delay to show the final highlight
                setTimeout(() => {
                  window.getSelection()?.removeAllRanges();
                  setSelectionRects([]);
                }, 100);
              }
            }
          }
        }
      }
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
  }, [isEnabled, onSelectionComplete]);

  if (!isEnabled || selectionRects.length === 0) {
    return null;
  }

  // Convert hex color to rgba with opacity
  const hexToRgba = (hex: string, opacity: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  };

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
            backgroundColor: hexToRgba(selectedColor, 0.4), // Use selected color with 40% opacity
            mixBlendMode: 'multiply',
            transition: 'all 0.05s ease-out',
          }}
        />
      ))}
    </>
  );
}

