'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { useEffect } from 'react';

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  editable?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  onBlur,
  placeholder = 'Type your note here...',
  editable = true,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: false, // Disable headings for sticky notes
        codeBlock: false, // Disable code blocks
        blockquote: false, // Disable blockquotes
        horizontalRule: false, // Disable horizontal rules
      }),
      Underline,
    ],
    content,
    editable,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      onBlur?.();
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[80px] p-2',
      },
    },
  });

  // Update editor content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="rich-text-editor">
      {/* Formatting Toolbar */}
      {editable && (
        <div className="flex items-center gap-1 p-1 bg-gray-50 border-b border-gray-200 rounded-t">
          {/* Bold */}
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bold') ? 'bg-gray-300 font-bold' : ''
            }`}
            title="Bold (Ctrl+B)"
            type="button"
          >
            <span className="text-sm font-bold">B</span>
          </button>

          {/* Italic */}
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('italic') ? 'bg-gray-300' : ''
            }`}
            title="Italic (Ctrl+I)"
            type="button"
          >
            <span className="text-sm italic">I</span>
          </button>

          {/* Underline */}
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('underline') ? 'bg-gray-300' : ''
            }`}
            title="Underline (Ctrl+U)"
            type="button"
          >
            <span className="text-sm underline">U</span>
          </button>

          {/* Strikethrough */}
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('strike') ? 'bg-gray-300' : ''
            }`}
            title="Strikethrough"
            type="button"
          >
            <span className="text-sm line-through">S</span>
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Bullet List */}
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="Bullet List"
            type="button"
          >
            <span className="text-sm">•</span>
          </button>

          {/* Ordered List */}
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 rounded hover:bg-gray-200 transition-colors ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="Numbered List"
            type="button"
          >
            <span className="text-sm">1.</span>
          </button>
        </div>
      )}

      {/* Editor Content */}
      <div className="bg-white">
        <EditorContent editor={editor} />
      </div>

      {/* Custom Styles for TipTap */}
      <style jsx global>{`
        .rich-text-editor .ProseMirror {
          min-height: 80px;
          max-height: 300px;
          overflow-y: auto;
        }

        .rich-text-editor .ProseMirror p {
          margin: 0.25rem 0;
        }

        .rich-text-editor .ProseMirror ul,
        .rich-text-editor .ProseMirror ol {
          padding-left: 1.5rem;
          margin: 0.25rem 0;
        }

        .rich-text-editor .ProseMirror li {
          margin: 0.125rem 0;
        }

        .rich-text-editor .ProseMirror strong {
          font-weight: 700;
        }

        .rich-text-editor .ProseMirror em {
          font-style: italic;
        }

        .rich-text-editor .ProseMirror u {
          text-decoration: underline;
        }

        .rich-text-editor .ProseMirror s {
          text-decoration: line-through;
        }

        .rich-text-editor .ProseMirror:focus {
          outline: none;
        }

        /* Placeholder */
        .rich-text-editor .ProseMirror p.is-editor-empty:first-child::before {
          content: '${placeholder}';
          color: #9ca3af;
          pointer-events: none;
          height: 0;
          float: left;
        }
      `}</style>
    </div>
  );
}

