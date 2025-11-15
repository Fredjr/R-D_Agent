'use client';

import React, { useEffect, useRef, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Document, Page, pdfjs } from 'react-pdf';

// Note: PDF.js worker is already configured in PDFViewer.tsx
// No need to reconfigure here to avoid conflicts

interface PageThumbnailsSidebarProps {
  pdfUrl: string;
  numPages: number;
  currentPage: number;
  onPageClick: (pageNumber: number) => void;
  onClose: () => void;
}

export default function PageThumbnailsSidebar({
  pdfUrl,
  numPages,
  currentPage,
  onPageClick,
  onClose,
}: PageThumbnailsSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const currentPageRef = useRef<HTMLDivElement>(null);

  // Scroll to current page when it changes
  useEffect(() => {
    if (currentPageRef.current) {
      currentPageRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentPage]);

  // Filter pages based on search query
  const filteredPages = Array.from({ length: numPages }, (_, i) => i + 1).filter(
    (pageNum) => {
      if (!searchQuery) return true;
      return pageNum.toString().includes(searchQuery);
    }
  );

  return (
    <div className="w-64 h-full bg-gray-900 text-white flex flex-col border-r border-gray-700">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700">
        <h3 className="text-sm font-semibold">Page Thumbnails</h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-700 rounded transition-colors"
          title="Close thumbnails"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Search Input */}
      <div className="p-3 border-b border-gray-700">
        <input
          type="text"
          placeholder="Search page number..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 bg-gray-800 text-white text-sm rounded border border-gray-600 focus:outline-none focus:border-purple-500"
        />
      </div>

      {/* Thumbnails List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {filteredPages.map((pageNum) => {
          const isCurrentPage = pageNum === currentPage;
          
          return (
            <div
              key={pageNum}
              ref={isCurrentPage ? currentPageRef : null}
              onClick={() => onPageClick(pageNum)}
              className={`
                cursor-pointer rounded-lg overflow-hidden transition-all
                ${isCurrentPage
                  ? 'ring-2 ring-purple-500 bg-purple-900/20'
                  : 'hover:ring-2 hover:ring-gray-500'
                }
              `}
            >
              {/* Thumbnail */}
              <div className="bg-white">
                <Document file={pdfUrl} loading={null} error={null}>
                  <Page
                    pageNumber={pageNum}
                    width={200}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    loading={
                      <div className="w-full h-[260px] bg-gray-800 flex items-center justify-center">
                        <div className="text-xs text-gray-400">Loading...</div>
                      </div>
                    }
                    error={
                      <div className="w-full h-[260px] bg-gray-800 flex items-center justify-center">
                        <div className="text-xs text-gray-400">Error</div>
                      </div>
                    }
                  />
                </Document>
              </div>

              {/* Page Number */}
              <div className={`
                text-center py-2 text-sm font-medium
                ${isCurrentPage ? 'bg-purple-600' : 'bg-gray-800'}
              `}>
                {pageNum}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

