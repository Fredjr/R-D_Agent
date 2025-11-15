'use client';

import { HIGHLIGHT_COLORS } from '@/types/pdf-annotations';
import { useState } from 'react';

interface BottomColorBarProps {
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isVisible: boolean;
  showAddNote?: boolean;
  onAddNoteToggle?: (enabled: boolean) => void;
}

/**
 * BottomColorBar - Cochrane Library-style bottom color selector
 * 
 * Shows horizontal color bar at bottom when a color tool is selected
 */
export default function BottomColorBar({
  selectedColor,
  onColorSelect,
  isVisible,
  showAddNote = false,
  onAddNoteToggle,
}: BottomColorBarProps) {
  const [addNoteEnabled, setAddNoteEnabled] = useState(false);

  if (!isVisible) {
    return null;
  }

  const handleAddNoteToggle = () => {
    const newState = !addNoteEnabled;
    setAddNoteEnabled(newState);
    onAddNoteToggle?.(newState);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-2xl">
      <div className="flex items-center justify-center gap-4 px-8 py-4">
        {/* Color selector label */}
        <span className="text-sm font-medium text-gray-700">
          Select Color:
        </span>

        {/* Color buttons */}
        <div className="flex items-center gap-3">
          {HIGHLIGHT_COLORS.map((color) => (
            <button
              key={color.hex}
              onClick={() => onColorSelect(color.hex)}
              className={`
                w-12 h-12 rounded-full border-4 transition-all duration-200
                ${
                  selectedColor === color.hex
                    ? 'border-gray-800 scale-110 shadow-lg ring-4 ring-blue-400'
                    : 'border-gray-300 hover:border-gray-500 hover:scale-105'
                }
              `}
              style={{ backgroundColor: color.hex }}
              title={color.name}
              aria-label={`Select ${color.name} color`}
            />
          ))}
        </div>

        {/* Add Note toggle (optional) */}
        {showAddNote && (
          <>
            <div className="w-px h-8 bg-gray-300" />
            <button
              onClick={handleAddNoteToggle}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200
                ${
                  addNoteEnabled
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }
              `}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              Add Note
            </button>
          </>
        )}
      </div>
    </div>
  );
}

