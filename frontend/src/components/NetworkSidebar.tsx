'use client';

import React, { useState } from 'react';
import { XMarkIcon, ArrowTopRightOnSquareIcon, BookmarkIcon, EyeIcon } from '@heroicons/react/24/outline';

interface NetworkNode {
  id: string;
  label: string;
  size: number;
  color: string;
  metadata: {
    pmid: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    citation_count: number;
    url: string;
  };
}

interface NetworkSidebarProps {
  selectedNode: NetworkNode | null;
  onClose: () => void;
  onDeepDive?: (pmid: string, title: string) => void;
  onSaveToCollection?: (pmid: string, title: string) => void;
  className?: string;
}

export default function NetworkSidebar({ 
  selectedNode, 
  onClose, 
  onDeepDive, 
  onSaveToCollection,
  className = '' 
}: NetworkSidebarProps) {
  const [isDeepDiving, setIsDeepDiving] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!selectedNode) {
    return null;
  }

  const { metadata } = selectedNode;

  const handleDeepDive = async () => {
    if (!onDeepDive) return;
    
    setIsDeepDiving(true);
    try {
      await onDeepDive(metadata.pmid, metadata.title);
    } catch (error) {
      console.error('Error starting deep dive:', error);
    } finally {
      setIsDeepDiving(false);
    }
  };

  const handleSaveToCollection = async () => {
    if (!onSaveToCollection) return;
    
    setIsSaving(true);
    try {
      await onSaveToCollection(metadata.pmid, metadata.title);
    } catch (error) {
      console.error('Error saving to collection:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const formatAuthors = (authors: string[]) => {
    if (authors.length === 0) return 'Unknown authors';
    if (authors.length <= 3) return authors.join(', ');
    return `${authors.slice(0, 3).join(', ')} et al.`;
  };

  const getYearColor = (year: number) => {
    if (year >= 2020) return 'text-green-600 bg-green-50';
    if (year >= 2015) return 'text-blue-600 bg-blue-50';
    if (year >= 2010) return 'text-orange-600 bg-orange-50';
    return 'text-gray-600 bg-gray-50';
  };

  const getCitationLevel = (count: number) => {
    if (count >= 1000) return { label: 'Highly Cited', color: 'text-red-600 bg-red-50' };
    if (count >= 100) return { label: 'Well Cited', color: 'text-orange-600 bg-orange-50' };
    if (count >= 10) return { label: 'Moderately Cited', color: 'text-blue-600 bg-blue-50' };
    return { label: 'Emerging', color: 'text-gray-600 bg-gray-50' };
  };

  const citationLevel = getCitationLevel(metadata.citation_count);

  return (
    <div className={`bg-white border-l border-gray-200 shadow-lg ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">Article Details</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getYearColor(metadata.year)}`}>
            {metadata.year}
          </span>
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${citationLevel.color}`}>
            {citationLevel.label}
          </span>
        </div>
      </div>

      <div className="p-4 space-y-4 overflow-y-auto">
        {/* Title */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Title</h4>
          <p className="text-sm text-gray-700 leading-relaxed">{metadata.title}</p>
        </div>

        {/* Authors */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Authors</h4>
          <p className="text-sm text-gray-600">{formatAuthors(metadata.authors)}</p>
        </div>

        {/* Journal */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Journal</h4>
          <p className="text-sm text-gray-600">{metadata.journal}</p>
        </div>

        {/* Citation Metrics */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-2">Citation Metrics</h4>
          <div className="bg-gray-50 p-3 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Total Citations</span>
              <span className="text-lg font-bold text-gray-900">{metadata.citation_count.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">PMID</span>
              <span className="text-sm font-mono text-blue-600">{metadata.pmid}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3 pt-4 border-t border-gray-200">
          <button
            onClick={() => window.open(metadata.url, '_blank')}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <ArrowTopRightOnSquareIcon className="w-4 h-4" />
            View on PubMed
          </button>

          {onDeepDive && (
            <button
              onClick={handleDeepDive}
              disabled={isDeepDiving}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <EyeIcon className="w-4 h-4" />
              {isDeepDiving ? 'Starting Analysis...' : 'Deep Dive Analysis'}
            </button>
          )}

          {onSaveToCollection && (
            <button
              onClick={handleSaveToCollection}
              disabled={isSaving}
              className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
            >
              <BookmarkIcon className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save to Collection'}
            </button>
          )}
        </div>

        {/* Network Context */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Network Context</h4>
          <div className="bg-blue-50 p-3 rounded-lg">
            <div className="text-xs text-blue-700 space-y-1">
              <div>• Node size reflects citation impact</div>
              <div>• Color indicates publication year</div>
              <div>• Connections show citation relationships</div>
              <div>• Click other nodes to explore network</div>
            </div>
          </div>
        </div>

        {/* Research Insights */}
        <div className="pt-4 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Research Insights</h4>
          <div className="space-y-2 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Publication Era:</span>
              <span className="font-medium">
                {metadata.year >= 2020 ? 'Recent Research' : 
                 metadata.year >= 2015 ? 'Established Work' : 
                 metadata.year >= 2010 ? 'Foundational' : 'Historical'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Impact Level:</span>
              <span className="font-medium">{citationLevel.label}</span>
            </div>
            <div className="flex justify-between">
              <span>Research Field:</span>
              <span className="font-medium">
                {metadata.journal.includes('Nature') ? 'High-Impact' :
                 metadata.journal.includes('Science') ? 'Multidisciplinary' :
                 metadata.journal.includes('Cell') ? 'Life Sciences' :
                 'Specialized'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
