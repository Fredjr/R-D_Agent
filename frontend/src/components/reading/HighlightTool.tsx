'use client';

import { useState, useEffect, useRef } from 'react';
import { HIGHLIGHT_COLORS, type TextSelection } from '@/types/pdf-annotations';

interface HighlightToolProps {
  onHighlight: (color: string, selection: TextSelection) => void;
  isEnabled: boolean;
}

export default function HighlightTool({ onHighlight, isEnabled }: HighlightToolProps) {
  const [selectedColor, setSelectedColor] = useState(HIGHLIGHT_COLORS[0].hex);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [pickerPosition, setPickerPosition] = useState({ x: 0, y: 0 });
  const [currentSelection, setCurrentSelection] = useState<TextSelection | null>(null);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isEnabled) return;

    const handleMouseUp = (e: MouseEvent) => {
      // Small delay to ensure selection is complete
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
          setShowColorPicker(false);
          setCurrentSelection(null);
          return;
        }

        const selectedText = selection.toString().trim();
        if (selectedText.length === 0) {
          setShowColorPicker(false);
          setCurrentSelection(null);
          return;
        }

        // Check if selection is within PDF text layer
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer;
        const textLayerElement = (container as Element).closest?.('.react-pdf__Page__textContent');
        
        if (!textLayerElement) {
          setShowColorPicker(false);
          setCurrentSelection(null);
          return;
        }

        // Get page number from the page element
        const pageElement = (container as Element).closest?.('.react-pdf__Page');
        const pageNumberAttr = pageElement?.getAttribute('data-page-number');
        const pageNumber = pageNumberAttr ? parseInt(pageNumberAttr) : 1;

        // Get bounding rectangles for the selection
        const rects = Array.from(range.getClientRects());
        if (rects.length === 0) {
          setShowColorPicker(false);
          setCurrentSelection(null);
          return;
        }

        // Calculate bounding rect that encompasses all selection rects
        const boundingRect = range.getBoundingClientRect();

        // Store selection data
        const textSelection: TextSelection = {
          text: selectedText,
          pageNumber,
          boundingRect,
          rects,
        };

        setCurrentSelection(textSelection);

        // Position color picker near the selection
        const x = Math.min(e.clientX, window.innerWidth - 250);
        const y = boundingRect.bottom + window.scrollY + 10;
        
        setPickerPosition({ x, y });
        setShowColorPicker(true);
      }, 10);
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (colorPickerRef.current && !colorPickerRef.current.contains(e.target as Node)) {
        setShowColorPicker(false);
        setCurrentSelection(null);
        window.getSelection()?.removeAllRanges();
      }
    };

    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isEnabled]);

  const handleColorSelect = (color: string) => {
    if (currentSelection) {
      onHighlight(color, currentSelection);
      setShowColorPicker(false);
      setCurrentSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!isEnabled || !showColorPicker) {
    return null;
  }

  return (
    <div
      ref={colorPickerRef}
      className="fixed z-[60] bg-white rounded-lg shadow-2xl border border-gray-200 p-3"
      style={{
        left: `${pickerPosition.x}px`,
        top: `${pickerPosition.y}px`,
      }}
    >
      <div className="flex flex-col gap-2">
        <p className="text-xs font-medium text-gray-700 mb-1">Choose highlight color:</p>
        <div className="flex gap-2">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => handleColorSelect(color.hex)}
              className={`
                w-8 h-8 rounded-full border-2 transition-all
                ${selectedColor === color.hex ? 'border-gray-800 scale-110' : 'border-gray-300'}
                hover:scale-110 hover:border-gray-600
              `}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Highlight with ${color.name}`}
            />
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-1">
          {currentSelection?.text.substring(0, 50)}
          {currentSelection && currentSelection.text.length > 50 ? '...' : ''}
        </p>
      </div>
    </div>
  );
}

