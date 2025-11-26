'use client';

import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { 
  XMarkIcon, 
  ChevronLeftIcon, 
  ChevronRightIcon, 
  MagnifyingGlassMinusIcon, 
  MagnifyingGlassPlusIcon,
  ArrowsPointingOutIcon,
  ArrowsPointingInIcon
} from '@heroicons/react/24/outline';

// Configure PDF.js worker
if (typeof window !== 'undefined') {
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;
}

interface NetworkPDFViewerProps {
  pmid: string;
  title?: string;
  onClose: () => void;
}

export default function NetworkPDFViewer({ pmid, title, onClose }: NetworkPDFViewerProps) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [pdfSource, setPdfSource] = useState<string>('');
  const [pdfAvailable, setPdfAvailable] = useState<boolean>(false);
  const [articleUrl, setArticleUrl] = useState<string>('');

  // 🎯 Notify network view that PDF viewer is open
  useEffect(() => {
    // Dispatch event to notify network view that PDF is opening
    window.dispatchEvent(new CustomEvent('pdfViewerOpened', {
      detail: { pmid, isExpanded }
    }));

    // Cleanup: notify when component unmounts
    return () => {
      window.dispatchEvent(new CustomEvent('pdfViewerClosed'));
    };
  }, [pmid]);

  // 🎯 Notify when expansion state changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('pdfViewerResized', {
      detail: { isExpanded }
    }));
  }, [isExpanded]);

  // 🎯 ESC key handler to close PDF viewer
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        console.log('🔑 ESC key pressed - closing PDF viewer');
        event.preventDefault();
        event.stopPropagation();
        onClose();
      }
    };

    // Use capture phase to intercept ESC before other handlers
    window.addEventListener('keydown', handleEscKey, true);
    return () => window.removeEventListener('keydown', handleEscKey, true);
  }, [onClose]);

  useEffect(() => {
    fetchPDF();
  }, [pmid]);

  const fetchPDF = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log(`🔍 Fetching PDF URL for PMID: ${pmid}`);
      const response = await fetch(`/api/proxy/articles/${pmid}/pdf-url`, {
        headers: {
          'User-ID': 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF URL');
      }

      const data = await response.json();
      console.log(`✅ PDF URL response:`, data);

      setPdfSource(data.source);
      setPdfAvailable(data.pdf_available);

      if (data.pdf_available) {
        // Check if source typically blocks proxying
        const DIRECT_LINK_SOURCES = [
          'wolters_kluwer',
          'wiley_enhanced',
          'wiley',
          'pubmed_fulltext_atypon',
          'pubmed_fulltext_silverchair',
          'pubmed_fulltext_highwire',
          'nejm',
          'springer',
          'oxford_academic',
        ];

        if (DIRECT_LINK_SOURCES.includes(data.source)) {
          // Open in new tab instead of proxying (these publishers block server requests)
          console.log(`📄 Opening PDF in new tab (source: ${data.source} typically blocks proxying)`);
          window.open(data.url, '_blank');
          setError(`PDF opened in new tab. ${data.source} requires direct browser access.`);
          setPdfUrl(null);
        } else {
          // Use our proxy endpoint to avoid CORS issues
          const proxyUrl = `/api/proxy/articles/${pmid}/pdf-proxy`;
          console.log(`🔄 Using proxy URL: ${proxyUrl}`);
          setPdfUrl(proxyUrl);
        }
      } else {
        // No direct PDF available - show message with link (don't auto-open)
        console.log(`ℹ️ PDF not available, article URL: ${data.url}`);
        setError(`PDF not directly available. Click the button below to view the article on the publisher's website.`);
        setPdfUrl(null);
        // Store the URL and source for the "Open Article" button
        setArticleUrl(data.url || '');
        setPdfSource(data.source);
      }
    } catch (err) {
      console.error('❌ Error fetching PDF:', err);
      setError('Failed to load PDF. The article may not be available or may be behind a paywall.');
      setPdfUrl(null);
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1);
  };

  const changePage = (offset: number) => {
    setPageNumber(prevPageNumber => Math.min(Math.max(1, prevPageNumber + offset), numPages));
  };

  const zoomIn = () => setScale(prev => Math.min(prev + 0.2, 2.0));
  const zoomOut = () => setScale(prev => Math.max(prev - 0.2, 0.5));

  return (
    <div
      className={`fixed top-0 right-0 h-full bg-white shadow-2xl border-l border-gray-300 flex flex-col transition-all duration-300 ${
        isExpanded ? 'w-[70%]' : 'w-[50%]'
      }`}
      style={{ zIndex: 9999 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-b border-blue-700 relative">
        <div className="flex-1 min-w-0 mr-12">
          <h3 className="text-sm font-semibold truncate">{title || 'PDF Viewer'}</h3>
          <p className="text-xs text-blue-100">PMID: {pmid}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 absolute right-4 top-1/2 -translate-y-1/2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            title={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ArrowsPointingInIcon className="w-5 h-5" />
            ) : (
              <ArrowsPointingOutIcon className="w-5 h-5" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-blue-500 rounded transition-colors"
            title="Close PDF (or press ESC)"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Controls */}
      {!loading && !error && pdfUrl && (
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
          {/* Page Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => changePage(-1)}
              disabled={pageNumber <= 1}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Previous page"
            >
              <ChevronLeftIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 min-w-[80px] text-center">
              {pageNumber} / {numPages}
            </span>
            <button
              onClick={() => changePage(1)}
              disabled={pageNumber >= numPages}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Next page"
            >
              <ChevronRightIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={zoomOut}
              disabled={scale <= 0.5}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 min-w-[50px] text-center">
              {Math.round(scale * 100)}%
            </span>
            <button
              onClick={zoomIn}
              disabled={scale >= 2.0}
              className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-50"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* PDF Content */}
      <div className="flex-1 overflow-auto bg-gray-100 flex justify-center items-start p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-sm text-gray-600">Loading PDF...</p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-8 text-center max-w-md">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-sm text-gray-700 mb-4">{error}</p>
            {articleUrl && (
              <button
                onClick={() => window.open(articleUrl, '_blank')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Open Article on Publisher Website
              </button>
            )}
            <p className="text-xs text-gray-500 mt-4">
              {articleUrl
                ? "The full text may be available on the publisher's website."
                : "This PDF may not be available or accessible."}
            </p>
          </div>
        )}

        {!loading && !error && pdfUrl && (
          <div className="bg-white shadow-lg">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={(error) => {
                console.error('PDF load error:', error);
                setError('Failed to load PDF document');
              }}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <Page
                pageNumber={pageNumber}
                scale={scale}
                renderTextLayer={true}
                renderAnnotationLayer={false}
              />
            </Document>
          </div>
        )}
      </div>

      {/* Read-Only Notice */}
      <div className="px-4 py-2 bg-yellow-50 border-t border-yellow-200 text-xs text-yellow-800">
        <span className="font-medium">📖 Read-Only Mode:</span> To annotate, highlight, or add notes, 
        add this paper to a collection first.
      </div>
    </div>
  );
}

