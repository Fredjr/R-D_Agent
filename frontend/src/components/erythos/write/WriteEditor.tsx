'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import { Citation } from './extensions/CitationExtension';

interface Document {
  document_id: string;
  title: string;
  content?: string;
  content_json?: any;
  word_count: number;
  citation_count: number;
  citation_style: string;
}

interface WriteEditorProps {
  document: Document | null;
  content: string;
  onContentChange: (content: string, wordCount: number) => void;
  onSave: () => void;
  onTitleChange: (title: string) => void;
}

export function WriteEditor({ document, content, onContentChange, onSave, onTitleChange }: WriteEditorProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [citationCounter, setCitationCounter] = useState(1);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing your thesis or paper here...',
      }),
      Underline,
      Link.configure({ openOnClick: false }),
      Highlight.configure({ multicolor: true }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Citation,
    ],
    content: document?.content_json || '<p></p>',
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[500px] outline-none text-white text-lg leading-relaxed',
        style: 'font-family: Georgia, serif;',
      },
      handleDrop: (view, event, slice, moved) => {
        const text = event.dataTransfer?.getData('text/plain');
        const sourceDataStr = event.dataTransfer?.getData('application/json');

        if (text && sourceDataStr) {
          event.preventDefault();
          const sourceData = JSON.parse(sourceDataStr);

          // Insert the text with a citation
          const citationNum = citationCounter;
          setCitationCounter(prev => prev + 1);

          const { state, dispatch } = view;
          const { tr } = state;
          const pos = view.posAtCoords({ left: event.clientX, top: event.clientY });

          if (pos) {
            // Insert text
            tr.insertText(text + ' ', pos.pos);
            // Add citation mark
            const citationText = `[${citationNum}]`;
            tr.insertText(citationText, pos.pos + text.length + 1);

            dispatch(tr);
          }

          return true;
        }
        return false;
      },
    },
    onUpdate: ({ editor }) => {
      const text = editor.getText();
      const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
      onContentChange(text, wordCount);
    },
  });

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        onSave();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSave]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    setIsDragOver(false);
  }, []);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#000]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#000] overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[#2C2C2E]">
        <div className="flex items-center gap-2">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-2 rounded-lg transition-colors ${
              editor.isActive('bold') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            <span className="font-bold text-sm">B</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-2 rounded-lg transition-colors ${
              editor.isActive('italic') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            <span className="italic text-sm">I</span>
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-lg transition-colors ${
              editor.isActive('underline') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            <span className="underline text-sm">U</span>
          </button>
          <div className="w-px h-6 bg-[#2C2C2E] mx-1"></div>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('heading', { level: 1 }) ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            H1
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('heading', { level: 2 }) ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            H2
          </button>
          <div className="w-px h-6 bg-[#2C2C2E] mx-1"></div>
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('bulletList') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            •
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('orderedList') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            1.
          </button>
          <div className="w-px h-6 bg-[#2C2C2E] mx-1"></div>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('highlight') ? 'bg-yellow-500 text-black' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            🖍️
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded-lg transition-colors text-sm ${
              editor.isActive('blockquote') ? 'bg-[#DC2626] text-white' : 'hover:bg-[#2C2C2E] text-gray-400 hover:text-white'
            }`}
          >
            ❝
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-2 hover:bg-[#2C2C2E] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-30"
          >
            ↩️
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-2 hover:bg-[#2C2C2E] rounded-lg transition-colors text-gray-400 hover:text-white disabled:opacity-30"
          >
            ↪️
          </button>
          <div className="w-px h-6 bg-[#2C2C2E]"></div>
          <button
            onClick={onSave}
            className="px-4 py-2 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white rounded-lg transition-colors text-sm"
          >
            💾 Save
          </button>
          <button className="px-4 py-2 bg-[#2C2C2E] hover:bg-[#3C3C3E] text-white rounded-lg transition-colors text-sm">
            📤 Share
          </button>
        </div>
      </div>

      {/* Editor Area */}
      <div
        className="flex-1 overflow-y-auto p-8"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={`max-w-3xl mx-auto ${isDragOver ? 'ring-2 ring-yellow-500 ring-offset-2 ring-offset-black rounded-lg p-4' : ''}`}>
          {/* Title */}
          <input
            type="text"
            value={document?.title || 'Untitled Document'}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Document Title"
            className="w-full text-3xl font-bold text-white bg-transparent border-none outline-none mb-6 placeholder-gray-600"
          />

          {/* TipTap Editor */}
          <EditorContent editor={editor} />

          {/* Drag hint */}
          {isDragOver && (
            <div className="mt-4 p-4 border-2 border-dashed border-yellow-500 rounded-lg text-center text-yellow-400">
              Drop source here to insert with citation
            </div>
          )}
        </div>
      </div>

      {/* Editor Styles */}
      <style jsx global>{`
        .ProseMirror {
          min-height: 500px;
        }
        .ProseMirror p.is-editor-empty:first-child::before {
          color: #6B7280;
          content: attr(data-placeholder);
          float: left;
          height: 0;
          pointer-events: none;
        }
        .ProseMirror .citation {
          color: #DC2626;
          font-weight: 600;
          cursor: pointer;
        }
        .ProseMirror blockquote {
          border-left: 3px solid #DC2626;
          padding-left: 1rem;
          margin-left: 0;
          color: #9CA3AF;
          font-style: italic;
        }
        .ProseMirror h1 {
          font-size: 2rem;
          font-weight: 700;
          margin-top: 1.5rem;
          margin-bottom: 1rem;
        }
        .ProseMirror h2 {
          font-size: 1.5rem;
          font-weight: 600;
          margin-top: 1.25rem;
          margin-bottom: 0.75rem;
        }
        .ProseMirror ul, .ProseMirror ol {
          padding-left: 1.5rem;
        }
        .ProseMirror mark {
          background-color: rgba(251, 191, 36, 0.3);
          color: inherit;
        }
      `}</style>
    </div>
  );
}

