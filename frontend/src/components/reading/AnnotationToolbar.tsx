'use client';

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { HIGHLIGHT_COLORS, type AnnotationType } from '@/types/pdf-annotations';

interface AnnotationToolbarProps {
  selectedTool: AnnotationType | null;
  onToolSelect: (tool: AnnotationType | null) => void;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  isEnabled: boolean;
}

export default function AnnotationToolbar({
  selectedTool,
  onToolSelect,
  selectedColor,
  onColorSelect,
  isEnabled,
}: AnnotationToolbarProps) {
  const [showColorPicker, setShowColorPicker] = useState(false);

  if (!isEnabled) {
    return null;
  }

  const tools = [
    {
      id: 'highlight' as AnnotationType,
      icon: '🎨',
      label: 'Highlight',
      description: 'Highlight text',
    },
    {
      id: 'underline' as AnnotationType,
      icon: 'U',
      label: 'Underline',
      description: 'Underline text',
      className: 'underline font-bold',
    },
    {
      id: 'strikethrough' as AnnotationType,
      icon: 'S',
      label: 'Strikethrough',
      description: 'Strikethrough text',
      className: 'line-through font-bold',
    },
    {
      id: 'sticky_note' as AnnotationType,
      icon: '📝',
      label: 'Sticky Note',
      description: 'Add sticky note',
    },
  ];

  return (
    <div className="fixed left-4 top-1/2 -translate-y-1/2 z-50 bg-gray-800 rounded-lg shadow-2xl p-2 flex flex-col gap-2">
      {/* Close button */}
      <button
        onClick={() => onToolSelect(null)}
        className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
        title="Close toolbar"
      >
        <XMarkIcon className="w-5 h-5" />
      </button>

      <div className="h-px bg-gray-600" />

      {/* Tools */}
      {tools.map((tool) => (
        <div key={tool.id} className="relative">
          <button
            onClick={() => {
              // Show color picker for text-based annotation tools
              if (tool.id === 'highlight' || tool.id === 'underline' || tool.id === 'strikethrough') {
                setShowColorPicker(!showColorPicker);
              }
              onToolSelect(selectedTool === tool.id ? null : tool.id);
            }}
            className={`
              w-12 h-12 flex items-center justify-center rounded transition-all
              ${
                selectedTool === tool.id
                  ? 'bg-blue-600 text-white scale-110'
                  : 'bg-gray-700 text-white hover:bg-gray-600'
              }
            `}
            title={tool.description}
          >
            <span className={`text-xl ${tool.className || ''}`}>{tool.icon}</span>
          </button>

          {/* Color picker for text-based annotation tools */}
          {(tool.id === 'highlight' || tool.id === 'underline' || tool.id === 'strikethrough') &&
           showColorPicker &&
           selectedTool === tool.id && (
            <div className="absolute left-full ml-2 top-0 bg-white rounded-lg shadow-xl p-3 flex flex-col gap-2">
              <p className="text-xs font-medium text-gray-700 mb-1">Choose color:</p>
              <div className="flex flex-col gap-2">
                {HIGHLIGHT_COLORS.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => {
                      onColorSelect(color.hex);
                      setShowColorPicker(false);
                    }}
                    className={`
                      w-10 h-10 rounded-full border-2 transition-all
                      ${
                        selectedColor === color.hex
                          ? 'border-gray-800 scale-110'
                          : 'border-gray-300'
                      }
                      hover:scale-110 hover:border-gray-600
                    `}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}

      {/* Selected color indicator for text-based annotation tools */}
      {(selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <div className="mt-2 flex items-center justify-center">
          <div
            className="w-8 h-8 rounded-full border-2 border-white"
            style={{ backgroundColor: selectedColor }}
            title="Current color"
          />
        </div>
      )}
    </div>
  );
}

