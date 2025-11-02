'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, PencilIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import HighlightTool from './HighlightTool';
import HighlightLayer from './HighlightLayer';
import AnnotationsSidebar from './AnnotationsSidebar';
import type { Highlight, TextSelection, PDFCoordinates } from '@/types/pdf-annotations';

// Configure PDF.js worker - use jsdelivr CDN with correct .mjs file
if (typeof window !== 'undefined') {
  // Only run in browser
  // Note: The worker file is pdf.worker.min.mjs (ES module), not .js
  const workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

  console.log('📄 PDF.js worker configured:', workerSrc);
  console.log('📄 PDF.js version:', pdfjs.version);
}

interface PDFViewerProps {
  pmid: string;
  title?: string;
  projectId?: string;
  onClose: () => void;
}

export default function PDFViewer({ pmid, title, projectId, onClose }: PDFViewerProps) {
  const { user } = useAuth();
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfSource, setPdfSource] = useState<string>('');
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(1.2);
  const [pdfAvailable, setPdfAvailable] = useState<boolean>(false);

  // Highlight functionality state
  const [highlightMode, setHighlightMode] = useState<boolean>(false);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [loadingHighlights, setLoadingHighlights] = useState<boolean>(false);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  useEffect(() => {
    fetchPDFUrl();
  }, [pmid]);

  // Load highlights when PDF loads and projectId is available
  useEffect(() => {
    if (pdfUrl && projectId && user) {
      fetchHighlights();
    }
  }, [pdfUrl, projectId, user, pmid]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') {
        goToPrevPage();
      } else if (e.key === 'ArrowRight') {
        goToNextPage();
      } else if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
        // Cmd/Ctrl + H to toggle highlight mode
        e.preventDefault();
        setHighlightMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  const fetchPDFUrl = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log(`📄 Fetching PDF URL for PMID: ${pmid}`);
      
      const response = await fetch(`/api/proxy/articles/${pmid}/pdf-url`, {
        headers: {
          'User-ID': 'default_user',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch PDF URL');
      }

      const data = await response.json();
      console.log('📄 PDF URL response:', data);
      
      setPdfSource(data.source);
      setPdfAvailable(data.pdf_available);
      
      if (data.pdf_available) {
        // Use our proxy endpoint to avoid CORS issues
        const proxyUrl = `/api/proxy/articles/${pmid}/pdf-proxy`;
        console.log('📄 Using PDF proxy:', proxyUrl);
        setPdfUrl(proxyUrl);
      } else {
        // No direct PDF available - show message with link
        setError(`PDF not directly available. This article may be behind a paywall.`);
        setPdfUrl(null);
        
        // Open the article URL in a new tab
        if (data.url) {
          window.open(data.url, '_blank');
        }
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
    console.log(`✅ PDF loaded successfully: ${numPages} pages`);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('❌ PDF load error:', error);
    setError('Failed to load PDF. The file may be corrupted or inaccessible.');
  };

  const goToPrevPage = () => {
    setPageNumber((prev) => Math.max(prev - 1, 1));
  };

  const goToNextPage = () => {
    setPageNumber((prev) => Math.min(prev + 1, numPages));
  };

  const zoomIn = () => {
    setScale((prev) => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale((prev) => Math.max(prev - 0.2, 0.5));
  };

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setPageNumber(page);
    }
  };

  // Fetch highlights for this article
  const fetchHighlights = async () => {
    if (!projectId || !user) return;

    try {
      setLoadingHighlights(true);
      console.log(`📝 Fetching highlights for PMID: ${pmid}`);

      const response = await fetch(
        `/api/proxy/projects/${projectId}/annotations?article_pmid=${pmid}`,
        {
          headers: {
            'User-ID': user.email,
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch highlights');
      }

      const data = await response.json();

      // Filter only annotations with PDF data
      const pdfHighlights = (data.annotations || []).filter(
        (a: any) => a.pdf_page !== null && a.pdf_coordinates !== null
      );

      setHighlights(pdfHighlights);
      console.log(`✅ Loaded ${pdfHighlights.length} highlights`);
    } catch (err) {
      console.error('❌ Error fetching highlights:', err);
    } finally {
      setLoadingHighlights(false);
    }
  };

  // Handle creating a new highlight
  const handleHighlight = useCallback(
    async (color: string, selection: TextSelection) => {
      if (!projectId || !user) {
        console.error('❌ Cannot create highlight: missing projectId or user');
        return;
      }

      try {
        console.log('📝 Creating highlight:', {
          page: selection.pageNumber,
          text: selection.text.substring(0, 50),
          color,
        });

        // Get the page canvas to calculate normalized coordinates
        const pageCanvas = document.querySelector(
          `.react-pdf__Page[data-page-number="${selection.pageNumber}"] canvas`
        ) as HTMLCanvasElement;

        if (!pageCanvas) {
          console.error('❌ Could not find page canvas');
          return;
        }

        const canvasWidth = pageCanvas.width;
        const canvasHeight = pageCanvas.height;

        // Convert client coordinates to canvas coordinates
        const canvasRect = pageCanvas.getBoundingClientRect();
        const x = (selection.boundingRect.left - canvasRect.left) / canvasRect.width;
        const y = (selection.boundingRect.top - canvasRect.top) / canvasRect.height;
        const width = selection.boundingRect.width / canvasRect.width;
        const height = selection.boundingRect.height / canvasRect.height;

        const coordinates: PDFCoordinates = {
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
          width: Math.max(0, Math.min(1, width)),
          height: Math.max(0, Math.min(1, height)),
          pageWidth: canvasWidth,
          pageHeight: canvasHeight,
        };

        // Create annotation with PDF fields
        const annotationData = {
          content: `Highlight: ${selection.text}`,
          article_pmid: pmid,
          note_type: 'highlight',
          priority: 'medium',
          status: 'active',
          pdf_page: selection.pageNumber,
          pdf_coordinates: coordinates,
          highlight_color: color,
          highlight_text: selection.text,
        };

        const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify(annotationData),
        });

        if (!response.ok) {
          throw new Error('Failed to create highlight');
        }

        const newHighlight = await response.json();
        console.log('✅ Highlight created:', newHighlight.annotation_id);

        // Add to local state
        setHighlights((prev) => [...prev, newHighlight]);
      } catch (err) {
        console.error('❌ Error creating highlight:', err);
      }
    },
    [projectId, user, pmid]
  );

  // Handle clicking on a highlight - navigate to page
  const handleHighlightClick = useCallback((highlight: Highlight) => {
    console.log('🖱️ Clicked highlight:', highlight.annotation_id, 'on page', highlight.pdf_page);

    // Navigate to the page containing the highlight
    if (highlight.pdf_page !== pageNumber) {
      setPageNumber(highlight.pdf_page);
    }

    // Open sidebar if closed
    if (!showSidebar) {
      setShowSidebar(true);
    }
  }, [pageNumber, showSidebar]);

  // Handle deleting a highlight
  const handleHighlightDelete = useCallback(
    async (annotationId: string) => {
      if (!projectId || !user) return;

      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'DELETE',
          headers: {
            'User-ID': user.email,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to delete highlight');
        }

        console.log('✅ Highlight deleted:', annotationId);

        // Remove from local state
        setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
      } catch (err) {
        console.error('❌ Error deleting highlight:', err);
        alert('Failed to delete highlight. Please try again.');
      }
    },
    [projectId, user]
  );

  // Handle changing highlight color
  const handleHighlightColorChange = useCallback(
    async (annotationId: string, newColor: string) => {
      if (!projectId || !user) return;

      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify({
            highlight_color: newColor,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update highlight color');
        }

        console.log('✅ Highlight color updated:', annotationId, newColor);

        // Update local state
        setHighlights((prev) =>
          prev.map((h) => (h.annotation_id === annotationId ? { ...h, highlight_color: newColor } : h))
        );
      } catch (err) {
        console.error('❌ Error updating highlight color:', err);
        alert('Failed to update highlight color. Please try again.');
      }
    },
    [projectId, user]
  );

  // Handle adding a note to a highlight
  const handleNoteAdd = useCallback(
    async (annotationId: string, note: string) => {
      if (!projectId || !user) return;

      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify({
            content: note,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to add note');
        }

        console.log('✅ Note added to highlight:', annotationId);

        // Update local state
        setHighlights((prev) =>
          prev.map((h) => (h.annotation_id === annotationId ? { ...h, content: note } : h))
        );
      } catch (err) {
        console.error('❌ Error adding note:', err);
        alert('Failed to add note. Please try again.');
      }
    },
    [projectId, user]
  );

  // Handle updating a note
  const handleNoteUpdate = useCallback(
    async (annotationId: string, note: string) => {
      // Same as handleNoteAdd - PATCH endpoint handles both
      await handleNoteAdd(annotationId, note);
    },
    [handleNoteAdd]
  );

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading PDF...</h3>
            <p className="text-sm text-gray-600 text-center">
              Searching for PDF in PubMed Central, Europe PMC, and Unpaywall...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !pdfUrl) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
          <div className="flex flex-col items-center">
            <div className="text-red-500 mb-4">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">PDF Not Available</h3>
            <p className="text-sm text-gray-600 text-center mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => window.open(`https://pubmed.ncbi.nlm.nih.gov/${pmid}/`, '_blank')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View on PubMed
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1 min-w-0">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={pageNumber <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page (←)"
            >
              <ChevronLeftIcon className="w-5 h-5 text-gray-700" />
            </button>
            
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={pageNumber}
                onChange={(e) => goToPage(parseInt(e.target.value))}
                className="w-16 px-2 py-1 text-center border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                min={1}
                max={numPages}
              />
              <span className="text-sm text-gray-600">/ {numPages}</span>
            </div>
            
            <button
              onClick={goToNextPage}
              disabled={pageNumber >= numPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page (→)"
            >
              <ChevronRightIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
            <button
              onClick={zoomOut}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom out"
            >
              <MagnifyingGlassMinusIcon className="w-5 h-5 text-gray-700" />
            </button>
            <span className="text-sm text-gray-600 w-16 text-center">{Math.round(scale * 100)}%</span>
            <button
              onClick={zoomIn}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
              title="Zoom in"
            >
              <MagnifyingGlassPlusIcon className="w-5 h-5 text-gray-700" />
            </button>
          </div>

          {/* Highlight Mode Toggle */}
          {projectId && (
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <button
                onClick={() => setHighlightMode(!highlightMode)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${highlightMode
                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                title={highlightMode ? 'Disable highlight mode (Cmd/Ctrl+H)' : 'Enable highlight mode (Cmd/Ctrl+H)'}
              >
                <PencilIcon className="w-5 h-5" />
              </button>
              {highlights.length > 0 && (
                <span className="text-xs text-gray-600">
                  {highlights.length} highlight{highlights.length !== 1 ? 's' : ''}
                </span>
              )}
            </div>
          )}

          {/* Sidebar Toggle */}
          {projectId && (
            <div className="flex items-center gap-2 border-l border-gray-300 pl-4">
              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`
                  p-2 rounded-lg transition-colors
                  ${showSidebar
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'hover:bg-gray-100 text-gray-700'
                  }
                `}
                title={showSidebar ? 'Hide annotations sidebar' : 'Show annotations sidebar'}
              >
                <Bars3Icon className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Title */}
          <div className="flex-1 min-w-0 border-l border-gray-300 pl-4">
            <p className="text-sm font-medium text-gray-900 truncate">{title || `PMID: ${pmid}`}</p>
            <p className="text-xs text-gray-500">Source: {pdfSource.toUpperCase()}</p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors ml-4"
          title="Close (Esc)"
        >
          <XMarkIcon className="w-6 h-6 text-gray-700" />
        </button>
      </div>

      {/* Main Content Area - Split View */}
      <div className="flex-1 flex overflow-hidden">
        {/* PDF Content */}
        <div
          className={`flex-1 overflow-auto bg-gray-800 flex justify-center items-start p-4 transition-all duration-300 ${
            showSidebar && projectId ? 'w-[70%]' : 'w-full'
          }`}
        >
          <div className="bg-white shadow-2xl relative">
            <Document
              file={pdfUrl}
              onLoadSuccess={onDocumentLoadSuccess}
              onLoadError={onDocumentLoadError}
              loading={
                <div className="flex items-center justify-center p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              <div className="relative">
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  inputRef={(ref) => {
                    if (ref) {
                      ref.setAttribute('data-page-number', pageNumber.toString());
                    }
                  }}
                />

                {/* Highlight Layer - renders existing highlights */}
                {projectId && (
                  <HighlightLayer
                    highlights={highlights}
                    pageNumber={pageNumber}
                    scale={scale}
                    onHighlightClick={handleHighlightClick}
                  />
                )}
              </div>
            </Document>
          </div>
        </div>

        {/* Annotations Sidebar */}
        {projectId && showSidebar && (
          <div className="w-[30%] h-full overflow-hidden">
            <AnnotationsSidebar
              highlights={highlights}
              currentPage={pageNumber}
              onHighlightClick={handleHighlightClick}
              onHighlightDelete={handleHighlightDelete}
              onHighlightColorChange={handleHighlightColorChange}
              onNoteAdd={handleNoteAdd}
              onNoteUpdate={handleNoteUpdate}
            />
          </div>
        )}
      </div>

      {/* Highlight Tool - color picker for text selection */}
      {projectId && (
        <HighlightTool
          onHighlight={handleHighlight}
          isEnabled={highlightMode}
        />
      )}

      {/* Footer with keyboard shortcuts */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Keyboard shortcuts: ← → (navigate pages) | Esc (close) | Cmd/Ctrl+H (toggle highlight mode)
        </p>
      </div>
    </div>
  );
}

