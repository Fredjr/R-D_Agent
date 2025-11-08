'use client';

import { useState, useRef, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import type { Highlight, StickyNotePosition } from '@/types/pdf-annotations';
import RichTextEditor from './RichTextEditor';

interface StickyNoteProps {
  annotation: Highlight;
  pageNumber: number;
  scale: number;
  onMove: (annotationId: string, newPosition: StickyNotePosition) => void;
  onResize: (annotationId: string, newSize: { width: number; height: number }) => void;
  onEdit: (annotationId: string, content: string) => void;
  onDelete: (annotationId: string) => void;
}

export default function StickyNote({
  annotation,
  pageNumber,
  scale,
  onMove,
  onResize,
  onEdit,
  onDelete,
}: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(annotation.content);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [position, setPosition] = useState(annotation.sticky_note_position);
  const noteRef = useRef<HTMLDivElement>(null);

  // Only show sticky note on its page
  if (annotation.pdf_page !== pageNumber || !position) {
    return null;
  }

  // Get page canvas to calculate pixel positions
  const getPageCanvas = () => {
    return document.querySelector(
      `.react-pdf__Page[data-page-number="${pageNumber}"] canvas`
    ) as HTMLCanvasElement;
  };

  // Convert normalized coordinates to pixel coordinates
  const getPixelPosition = () => {
    const canvas = getPageCanvas();
    if (!canvas) return { x: 0, y: 0, width: 200, height: 150 };

    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;

    return {
      x: position.x * canvasWidth,
      y: position.y * canvasHeight,
      width: position.width,
      height: position.height,
    };
  };

  const pixelPos = getPixelPosition();

  // Handle drag start
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isResizing) return;
    
    e.stopPropagation();
    setIsDragging(true);
    setDragStart({
      x: e.clientX - pixelPos.x,
      y: e.clientY - pixelPos.y,
    });
  };

  // Handle drag move
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const canvas = getPageCanvas();
      if (!canvas) return;

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;

      // Calculate new position in pixels
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Convert to normalized coordinates (0-1)
      const normalizedX = Math.max(0, Math.min(1, newX / canvasWidth));
      const normalizedY = Math.max(0, Math.min(1, newY / canvasHeight));

      setPosition({
        ...position,
        x: normalizedX,
        y: normalizedY,
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      if (position) {
        onMove(annotation.annotation_id, position);
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStart, position, annotation.annotation_id, onMove]);

  // Handle resize
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!noteRef.current) return;

      const rect = noteRef.current.getBoundingClientRect();
      const newWidth = Math.max(150, e.clientX - rect.left);
      const newHeight = Math.max(100, e.clientY - rect.top);

      setPosition({
        ...position,
        width: newWidth,
        height: newHeight,
      });
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      if (position) {
        onResize(annotation.annotation_id, {
          width: position.width,
          height: position.height,
        });
      }
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, position, annotation.annotation_id, onResize]);

  // Handle content save
  const handleSave = () => {
    onEdit(annotation.annotation_id, content);
    setIsEditing(false);
  };

  return (
    <div
      ref={noteRef}
      className={`absolute z-20 rounded-lg shadow-lg border-2 ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
      style={{
        left: `${pixelPos.x}px`,
        top: `${pixelPos.y}px`,
        width: `${pixelPos.width}px`,
        height: `${pixelPos.height}px`,
        backgroundColor: annotation.sticky_note_color || '#FFEB3B',
        borderColor: '#FBC02D',
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-yellow-600 bg-yellow-400 rounded-t-lg cursor-grab">
        <span className="text-xs font-medium text-yellow-900">📝 Note</span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm('Delete this sticky note?')) {
              onDelete(annotation.annotation_id);
            }
          }}
          className="p-1 hover:bg-yellow-500 rounded transition-colors"
          title="Delete note"
        >
          <XMarkIcon className="w-4 h-4 text-yellow-900" />
        </button>
      </div>

      {/* Content */}
      <div
        className="overflow-auto"
        style={{ height: 'calc(100% - 40px)' }}
        onClick={(e) => {
          e.stopPropagation();
          if (!isEditing) {
            setIsEditing(true);
          }
        }}
      >
        {isEditing ? (
          <div className="h-full flex flex-col">
            <RichTextEditor
              content={content}
              onChange={setContent}
              onBlur={handleSave}
              placeholder="Type your note here..."
              editable={true}
            />
            <div className="flex gap-2 mt-2 px-2 pb-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSave();
                }}
                className="flex-1 px-2 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
              >
                Save
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setContent(annotation.content);
                  setIsEditing(false);
                }}
                className="flex-1 px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div
            className="text-sm text-gray-900 p-3"
            dangerouslySetInnerHTML={{ __html: content || 'Click to add note...' }}
          />
        )}
      </div>

      {/* Resize handle */}
      <div
        className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
        style={{
          background: 'linear-gradient(135deg, transparent 50%, #FBC02D 50%)',
        }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
}

