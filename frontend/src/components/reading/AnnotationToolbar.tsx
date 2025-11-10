'use client';

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

  // Check if current tool uses colors
  const isColorTool = selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough';

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
        <button
          key={tool.id}
          onClick={() => {
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
      ))}

      {/* Horizontal Color Bar - Always visible when a color tool is selected */}
      {isColorTool && (
        <>
          <div className="h-px bg-gray-600 my-1" />
          <div className="flex flex-col gap-1 px-1">
            <p className="text-[10px] text-gray-300 text-center mb-1">Color:</p>
            {HIGHLIGHT_COLORS.map((color) => (
              <button
                key={color.hex}
                onClick={() => onColorSelect(color.hex)}
                className={`
                  w-10 h-10 rounded-full border-2 transition-all
                  ${
                    selectedColor === color.hex
                      ? 'border-white scale-110 ring-2 ring-blue-400'
                      : 'border-gray-500'
                  }
                  hover:scale-105 hover:border-white
                `}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

