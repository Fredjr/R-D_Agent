'use client';

import React from 'react';
import { 
  BookmarkIcon, 
  DocumentTextIcon, 
  BeakerIcon, 
  ShareIcon,
  EyeIcon 
} from '@heroicons/react/24/outline';

interface TriagedPaperCardProps {
  id: string;
  title: string;
  authors?: string[];
  year?: number;
  journal?: string;
  pmid: string;
  abstract?: string;
  triageStatus: 'must_read' | 'nice_to_know' | 'ignore';
  relevanceScore: number;
  evidenceLinks?: Array<{
    type: 'question' | 'hypothesis';
    text: string;
  }>;
  isSelected?: boolean;
  isFocused?: boolean;
  batchMode?: boolean;
  onSelect?: () => void;
  onSave?: () => void;
  onReadPdf?: () => void;
  onDeepDive?: () => void;
  onNetworkView?: () => void;
  onExtractProtocol?: () => void;
}

const statusConfig = {
  must_read: { label: 'MUST READ', bg: 'bg-red-500/20', text: 'text-red-400', border: 'border-red-500/30' },
  nice_to_know: { label: 'NICE TO KNOW', bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  ignore: { label: 'IGNORED', bg: 'bg-gray-500/20', text: 'text-gray-400', border: 'border-gray-500/30' },
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  if (score >= 40) return 'text-orange-400';
  return 'text-red-400';
};

export function ErythosTriagedPaperCard({
  id,
  title,
  authors = [],
  year,
  journal,
  pmid,
  abstract,
  triageStatus,
  relevanceScore,
  evidenceLinks = [],
  isSelected = false,
  isFocused = false,
  batchMode = false,
  onSelect,
  onSave,
  onReadPdf,
  onDeepDive,
  onNetworkView,
  onExtractProtocol
}: TriagedPaperCardProps) {
  const status = statusConfig[triageStatus];

  return (
    <div 
      className={`
        relative p-4 rounded-xl border transition-all duration-200
        bg-gradient-to-br from-gray-800/50 to-gray-900/50
        ${isFocused ? 'border-orange-500 ring-2 ring-orange-500/30' : 'border-gray-700/50 hover:border-gray-600'}
        ${isSelected ? 'bg-orange-500/10' : ''}
      `}
    >
      {/* Header row */}
      <div className="flex items-start gap-3 mb-3">
        {/* Checkbox for batch mode */}
        {batchMode && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onSelect}
            className="mt-1.5 w-4 h-4 rounded border-gray-500 bg-gray-700 text-orange-500 focus:ring-orange-500"
          />
        )}
        
        {/* Title and status */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium leading-tight line-clamp-2 hover:text-orange-400 transition-colors cursor-pointer">
            {title}
          </h3>
        </div>

        {/* Triage badge */}
        <div className={`flex-shrink-0 px-2 py-1 rounded text-xs font-semibold ${status.bg} ${status.text} ${status.border} border`}>
          {status.label}
        </div>

        {/* Relevance score */}
        <div className="flex-shrink-0 text-right">
          <span className={`text-2xl font-bold ${getScoreColor(relevanceScore)}`}>
            {relevanceScore}
          </span>
          <span className="text-sm text-gray-500">/100</span>
        </div>
      </div>

      {/* Meta info */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400 mb-3">
        {authors.length > 0 && (
          <span>{authors.slice(0, 3).join(', ')}{authors.length > 3 ? ' et al.' : ''}</span>
        )}
        {year && <span>• {year}</span>}
        {journal && <span>• {journal}</span>}
        <span className="text-orange-400">• PMID: {pmid}</span>
      </div>

      {/* Abstract */}
      {abstract && (
        <p className="text-sm text-gray-300 line-clamp-3 mb-3">
          {abstract}
        </p>
      )}

      {/* Evidence Links */}
      {evidenceLinks.length > 0 && (
        <div className="mb-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
          <div className="flex items-center gap-2 text-purple-400 text-sm font-medium mb-2">
            <span>🔗</span>
            <span>Evidence Links</span>
          </div>
          <div className="space-y-1">
            {evidenceLinks.map((link, i) => (
              <div key={i} className="text-xs text-purple-300">
                {link.type === 'hypothesis' ? '📊' : '❓'} {link.text}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <ActionButton icon={BookmarkIcon} label="Save" onClick={onSave} />
        <ActionButton icon={DocumentTextIcon} label="PDF" onClick={onReadPdf} />
        <ActionButton icon={EyeIcon} label="Deep Dive" onClick={onDeepDive} />
        <ActionButton icon={ShareIcon} label="Network" onClick={onNetworkView} />
        <ActionButton icon={BeakerIcon} label="Protocol" onClick={onExtractProtocol} />
      </div>
    </div>
  );
}

function ActionButton({ 
  icon: Icon, 
  label, 
  onClick 
}: { 
  icon: React.ComponentType<{ className?: string }>; 
  label: string; 
  onClick?: () => void 
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-300 
        bg-gray-700/50 hover:bg-gray-600/50 border border-gray-600/50 hover:border-gray-500
        rounded-lg transition-all duration-200"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

