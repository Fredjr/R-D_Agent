'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  DocumentTextIcon,
  PhotoIcon,
  ChartBarIcon,
  LinkIcon,
  BookOpenIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import AnnotationsSidebar from './AnnotationsSidebar';
import FiguresTab from './FiguresTab';
import MetricsTab from './MetricsTab';
import RelatedArticlesTab from './RelatedArticlesTab';
import ReferencesTab from './ReferencesTab';
import CitationsTab from './CitationsTab';
import type { Highlight } from '@/types/pdf-annotations';

type TabType = 'notes' | 'figures' | 'metrics' | 'related' | 'references' | 'citations';

interface PDFSidebarTabsProps {
  // Notes tab props
  highlights: Highlight[];
  currentPage: number;
  onHighlightClick: (highlight: Highlight) => void;
  onHighlightDelete: (annotationId: string) => void;
  onHighlightColorChange: (annotationId: string, newColor: string) => void;
  onNoteAdd: (annotationId: string, note: string) => void;
  onNoteUpdate: (annotationId: string, note: string) => void;

  // Common props
  pmid: string;
  projectId?: string;
  collectionId?: string;
  userId?: string;
  pdfUrl?: string;
  pdfDocument?: any; // PDF.js document object

  // Callbacks
  onClose?: () => void;
  onViewPDF?: (pmid: string) => void;
  onAddToCollection?: (pmid: string) => void;
  onPageNavigate?: (pageNumber: number) => void; // NEW: Navigate to page
}

export default function PDFSidebarTabs({
  highlights,
  currentPage,
  onHighlightClick,
  onHighlightDelete,
  onHighlightColorChange,
  onNoteAdd,
  onNoteUpdate,
  pmid,
  projectId,
  collectionId,
  userId,
  pdfUrl,
  pdfDocument,
  onClose,
  onViewPDF,
  onAddToCollection,
  onPageNavigate,
}: PDFSidebarTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('notes');

  const tabs = [
    { id: 'notes' as TabType, label: 'Notes', icon: DocumentTextIcon, count: highlights.length },
    { id: 'figures' as TabType, label: 'Figures', icon: PhotoIcon },
    { id: 'metrics' as TabType, label: 'Metrics', icon: ChartBarIcon },
    { id: 'related' as TabType, label: 'Related', icon: LinkIcon },
    { id: 'references' as TabType, label: 'References', icon: BookOpenIcon },
    { id: 'citations' as TabType, label: 'Citations', icon: DocumentDuplicateIcon },
  ];

  return (
    <div className="w-full h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Header with "Notes" title */}
      <div className="border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50 px-4 py-3">
        <h2 className="text-lg font-semibold text-gray-900">Notes</h2>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 bg-white">
        <div className="flex items-center overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap
                  ${isActive
                    ? 'border-purple-600 text-purple-600 bg-purple-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={`
                    px-1.5 py-0.5 text-xs rounded-full
                    ${isActive ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}
                  `}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'notes' && (
          <AnnotationsSidebar
            highlights={highlights}
            currentPage={currentPage}
            onHighlightClick={onHighlightClick}
            onHighlightDelete={onHighlightDelete}
            onHighlightColorChange={onHighlightColorChange}
            onNoteAdd={onNoteAdd}
            onNoteUpdate={onNoteUpdate}
            onClose={onClose}
          />
        )}

        {activeTab === 'figures' && (
          <FiguresTab
            pmid={pmid}
            pdfUrl={pdfUrl}
            pdfDocument={pdfDocument}
            onFigureClick={(pageNumber) => {
              if (onPageNavigate) {
                onPageNavigate(pageNumber);
              }
            }}
          />
        )}

        {activeTab === 'metrics' && (
          <MetricsTab pmid={pmid} />
        )}

        {activeTab === 'related' && (
          <RelatedArticlesTab
            pmid={pmid}
            projectId={projectId}
            userId={userId}
            onViewPDF={onViewPDF}
            onAddToCollection={onAddToCollection}
          />
        )}

        {activeTab === 'references' && (
          <ReferencesTab
            pmid={pmid}
            projectId={projectId}
            userId={userId}
            onViewPDF={onViewPDF}
            onAddToCollection={onAddToCollection}
          />
        )}

        {activeTab === 'citations' && (
          <CitationsTab
            pmid={pmid}
            projectId={projectId}
            userId={userId}
            onViewPDF={onViewPDF}
            onAddToCollection={onAddToCollection}
          />
        )}
      </div>
    </div>
  );
}

