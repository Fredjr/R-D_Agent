'use client';

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WriteSource {
  source_id: string;
  title: string;
  text: string;
  paper_title?: string;
}

interface WriteAIAssistantProps {
  documentId?: string;
  collectionId: string;
  sources: WriteSource[];
  onInsertText: (text: string) => void;
}

export function WriteAIAssistant({ documentId, collectionId, sources, onInsertText }: WriteAIAssistantProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [context, setContext] = useState('');

  const handleGenerate = async (type: string) => {
    if (!user?.email) return;
    setLoading(true);
    
    try {
      const res = await fetch('/api/proxy/write/ai/generate', {
        method: 'POST',
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          type,
          context: context || undefined,
          sources: selectedSources.length > 0 ? selectedSources : undefined,
          document_id: documentId
        })
      });
      
      if (res.ok) {
        const data = await res.json();
        onInsertText(data.generated_text);
      }
    } catch (error) {
      console.error('Error generating content:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    if (!user?.email || !documentId) return;
    
    try {
      const res = await fetch('/api/proxy/write/export', {
        method: 'POST',
        headers: {
          'User-ID': user.email,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          document_id: documentId,
          format,
          citation_style: 'vancouver'
        })
      });
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = window.document.createElement('a');
        a.href = url;
        a.download = `document.${format}`;
        a.click();
      }
    } catch (error) {
      console.error('Error exporting:', error);
    }
  };

  return (
    <div className="w-[320px] bg-[#1C1C1E] border-l border-[#2C2C2E] flex flex-col">
      {/* Header */}
      <div className="p-5 border-b border-[#2C2C2E]">
        <h2 className="text-lg font-bold text-[#DC2626]">🤖 AI Assistant</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Context Input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Topic/Context</label>
          <textarea
            value={context}
            onChange={(e) => setContext(e.target.value)}
            placeholder="Describe what you want to write about..."
            className="w-full px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm placeholder-gray-500 focus:border-[#DC2626] focus:outline-none resize-none h-20"
          />
        </div>

        {/* Generate Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>✨</span> Generate
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => handleGenerate('report')}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm hover:border-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50 text-left"
            >
              📄 Generate Report
            </button>
            <button
              onClick={() => handleGenerate('section')}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm hover:border-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50 text-left"
            >
              📝 Generate Section
            </button>
            <button
              onClick={() => handleGenerate('outline')}
              disabled={loading}
              className="w-full px-4 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm hover:border-[#DC2626] hover:bg-[#DC2626]/10 transition-colors disabled:opacity-50 text-left"
            >
              📋 Generate Outline
            </button>
          </div>
        </div>

        {/* Improve Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>✏️</span> Improve Selection
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleGenerate('rewrite')}
              disabled={loading}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-[#DC2626] transition-colors disabled:opacity-50"
            >
              🔄 Rewrite
            </button>
            <button
              onClick={() => handleGenerate('expand')}
              disabled={loading}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-[#DC2626] transition-colors disabled:opacity-50"
            >
              📈 Expand
            </button>
            <button
              onClick={() => handleGenerate('shorten')}
              disabled={loading}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-[#DC2626] transition-colors disabled:opacity-50"
            >
              📉 Shorten
            </button>
            <button
              onClick={() => handleGenerate('academic')}
              disabled={loading}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-[#DC2626] transition-colors disabled:opacity-50"
            >
              🎓 Academic
            </button>
          </div>
        </div>

        {/* Export Section */}
        <div>
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <span>📤</span> Export
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleExport('word')}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-blue-500 transition-colors"
            >
              📘 Word
            </button>
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-red-500 transition-colors"
            >
              📕 PDF
            </button>
            <button
              onClick={() => handleExport('latex')}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-green-500 transition-colors"
            >
              📗 LaTeX
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-xs hover:border-purple-500 transition-colors"
            >
              📓 Markdown
            </button>
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center justify-center py-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#DC2626]"></div>
            <span className="ml-2 text-sm text-gray-400">Generating...</span>
          </div>
        )}
      </div>

      {/* Citation Style */}
      <div className="p-4 border-t border-[#2C2C2E]">
        <label className="block text-xs text-gray-500 mb-2">Citation Style</label>
        <select className="w-full px-3 py-2 bg-[#000] border border-[#2C2C2E] rounded-lg text-white text-sm focus:border-[#DC2626] focus:outline-none">
          <option value="vancouver">Vancouver</option>
          <option value="apa">APA 7th</option>
          <option value="harvard">Harvard</option>
          <option value="chicago">Chicago</option>
        </select>
      </div>
    </div>
  );
}

