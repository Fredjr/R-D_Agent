'use client';

import { XMarkIcon } from '@heroicons/react/24/outline';
import type { AnnotationType } from '@/types/pdf-annotations';

interface RightAnnotationToolbarProps {
  selectedTool: AnnotationType | null;
  onToolSelect: (tool: AnnotationType | null) => void;
  isVisible: boolean;
  onClose: () => void;
}

/**
 * RightAnnotationToolbar - Cochrane Library-style right sidebar
 * 
 * Shows annotation tools vertically on the right side when "Annotate" is active
 */
export default function RightAnnotationToolbar({
  selectedTool,
  onToolSelect,
  isVisible,
  onClose,
}: RightAnnotationToolbarProps) {
  if (!isVisible) {
    return null;
  }

  const tools = [
    {
      id: 'highlight' as AnnotationType,
      label: 'Highlight',
      description: 'Highlight text',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
        </svg>
      ),
    },
    {
      id: 'underline' as AnnotationType,
      label: 'Underline',
      description: 'Underline text',
      icon: (
        <div className="text-xl font-bold underline">U</div>
      ),
    },
    {
      id: 'strikethrough' as AnnotationType,
      label: 'Strikethrough',
      description: 'Strike through text',
      icon: (
        <div className="text-xl font-bold line-through">S</div>
      ),
    },
    {
      id: 'drawing' as AnnotationType,
      label: 'Free Form',
      description: 'Draw freeform shapes',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 19l7-7 3 3-7 7-3-3z" />
          <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
          <path d="M2 2l7.586 7.586" />
          <circle cx="11" cy="11" r="2" />
        </svg>
      ),
    },
    {
      id: 'sticky_note' as AnnotationType,
      label: 'Sticky Note',
      description: 'Add a sticky note',
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
        </svg>
      ),
    },
  ];

  return (
    <div className="fixed right-0 top-1/2 -translate-y-1/2 z-50 bg-white shadow-2xl rounded-l-xl border-l border-t border-b border-gray-200">
      <div className="flex flex-col p-2 gap-2">
        {/* Close button */}
        <button
          onClick={onClose}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Close annotation tools"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>

        <div className="h-px bg-gray-200" />

        {/* Tool buttons */}
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => {
              onToolSelect(selectedTool === tool.id ? null : tool.id);
            }}
            className={`
              w-14 h-14 flex flex-col items-center justify-center rounded-lg
              transition-all duration-200
              ${
                selectedTool === tool.id
                  ? 'bg-purple-600 text-white shadow-lg scale-105'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100 hover:shadow-md'
              }
            `}
            title={tool.description}
          >
            <div className="flex items-center justify-center">
              {tool.icon}
            </div>
            <span className="text-[10px] mt-1 font-medium">{tool.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

