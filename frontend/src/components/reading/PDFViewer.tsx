'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import { XMarkIcon, ChevronLeftIcon, ChevronRightIcon, MagnifyingGlassMinusIcon, MagnifyingGlassPlusIcon, PencilIcon, Bars3Icon } from '@heroicons/react/24/outline';
import { useAuth } from '@/contexts/AuthContext';
import { useAnnotationWebSocket } from '@/hooks/useAnnotationWebSocket';
import HighlightTool from './HighlightTool';
import HighlightLayer from './HighlightLayer';
import SelectionOverlay from './SelectionOverlay';
import AnnotationsSidebar from './AnnotationsSidebar';
import StickyNote from './StickyNote';
import AnnotationToolbar from './AnnotationToolbar';
import type { Highlight, TextSelection, PDFCoordinates, AnnotationType, StickyNotePosition } from '@/types/pdf-annotations';
import { HIGHLIGHT_COLORS } from '@/types/pdf-annotations';

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

  // Annotation toolbar state
  const [selectedTool, setSelectedTool] = useState<AnnotationType | null>(null);
  const [selectedColor, setSelectedColor] = useState<string>(HIGHLIGHT_COLORS[0].hex);

  // Sidebar state
  const [showSidebar, setShowSidebar] = useState<boolean>(true);

  // WebSocket for real-time annotation updates
  useAnnotationWebSocket({
    projectId: projectId || '',
    userId: user?.email,
    onNewAnnotation: (annotation) => {
      console.log('📥 New annotation received via WebSocket:', annotation);
      // Only add if it matches current PMID
      if (annotation.article_pmid === pmid) {
        setHighlights((prev) => {
          // Avoid duplicates
          if (prev.some((a) => a.annotation_id === annotation.annotation_id)) {
            return prev;
          }
          return [...prev, annotation];
        });
      }
    },
    onUpdateAnnotation: (annotation) => {
      console.log('📥 Updated annotation received via WebSocket:', annotation);
      // Update if it matches current PMID
      if (annotation.article_pmid === pmid) {
        setHighlights((prev) =>
          prev.map((h) => (h.annotation_id === annotation.annotation_id ? annotation : h))
        );
      }
    },
    onDeleteAnnotation: (annotationId) => {
      console.log('📥 Deleted annotation received via WebSocket:', annotationId);
      setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
    },
    enabled: !!projectId && !!user,
  });

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

  // Handle creating a new annotation (highlight, underline, strikethrough)
  const handleHighlight = useCallback(
    async (color: string, selection: TextSelection) => {
      if (!projectId || !user) {
        console.error('❌ Cannot create annotation: missing projectId or user');
        return;
      }

      // Determine annotation type based on selected tool
      const annotationType = selectedTool || 'highlight';

      // Skip if tool is sticky_note (handled separately)
      if (annotationType === 'sticky_note') {
        return;
      }

      try {
        console.log(`📝 Creating ${annotationType}:`, {
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
          content: `${annotationType}: ${selection.text}`,
          article_pmid: pmid,
          note_type: annotationType,
          priority: 'medium',
          status: 'active',
          pdf_page: selection.pageNumber,
          pdf_coordinates: coordinates,
          highlight_color: color,
          highlight_text: selection.text,
          annotation_type: annotationType,
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
          throw new Error(`Failed to create ${annotationType}`);
        }

        const newAnnotation = await response.json();
        console.log(`✅ ${annotationType} created:`, newAnnotation.annotation_id);

        // Add to local state
        setHighlights((prev) => [...prev, newAnnotation]);
      } catch (err) {
        console.error('❌ Error creating annotation:', err);
      }
    },
    [projectId, user, pmid, selectedTool]
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

  // Handle automatic highlight creation from drag-to-highlight
  const handleDragToHighlight = useCallback(
    async (selection: {
      text: string;
      pageNumber: number;
      boundingRect: DOMRect;
      rects: DOMRect[];
    }) => {
      console.log('🎨 Drag-to-highlight completed:', selection.text.substring(0, 50));

      // Get the selected color from the toolbar
      const color = selectedColor || HIGHLIGHT_COLORS[0].hex;

      // Create TextSelection object
      const textSelection: TextSelection = {
        text: selection.text,
        pageNumber: selection.pageNumber,
        boundingRect: selection.boundingRect,
        rects: selection.rects,
      };

      // Call the existing handleHighlight function
      await handleHighlight(color, textSelection);
    },
    [selectedColor, handleHighlight]
  );

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

  // Handle creating a sticky note
  const handleCreateStickyNote = useCallback(
    async (pageNum: number, position: StickyNotePosition) => {
      if (!projectId || !user) return;

      try {
        const annotationData = {
          content: '',
          article_pmid: pmid,
          note_type: 'general',
          pdf_page: pageNum,
          annotation_type: 'sticky_note',
          sticky_note_position: position,
          sticky_note_color: '#FFEB3B',
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
          throw new Error('Failed to create sticky note');
        }

        const newAnnotation = await response.json();
        console.log('✅ Sticky note created:', newAnnotation.annotation_id);

        setHighlights((prev) => [...prev, newAnnotation]);
      } catch (err) {
        console.error('❌ Error creating sticky note:', err);
        alert('Failed to create sticky note. Please try again.');
      }
    },
    [projectId, user, pmid]
  );

  // Handle moving a sticky note
  const handleStickyNoteMove = useCallback(
    async (annotationId: string, newPosition: StickyNotePosition) => {
      if (!projectId || !user) return;

      try {
        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify({
            sticky_note_position: newPosition,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to move sticky note');
        }

        console.log('✅ Sticky note moved:', annotationId);

        // Update local state
        setHighlights((prev) =>
          prev.map((h) =>
            h.annotation_id === annotationId ? { ...h, sticky_note_position: newPosition } : h
          )
        );
      } catch (err) {
        console.error('❌ Error moving sticky note:', err);
      }
    },
    [projectId, user]
  );

  // Handle resizing a sticky note
  const handleStickyNoteResize = useCallback(
    async (annotationId: string, newSize: { width: number; height: number }) => {
      if (!projectId || !user) return;

      try {
        const annotation = highlights.find((h) => h.annotation_id === annotationId);
        if (!annotation || !annotation.sticky_note_position) return;

        const newPosition = {
          ...annotation.sticky_note_position,
          ...newSize,
        };

        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify({
            sticky_note_position: newPosition,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to resize sticky note');
        }

        console.log('✅ Sticky note resized:', annotationId);

        // Update local state
        setHighlights((prev) =>
          prev.map((h) =>
            h.annotation_id === annotationId ? { ...h, sticky_note_position: newPosition } : h
          )
        );
      } catch (err) {
        console.error('❌ Error resizing sticky note:', err);
      }
    },
    [projectId, user, highlights]
  );

  // Handle editing sticky note content
  const handleStickyNoteEdit = useCallback(
    async (annotationId: string, content: string) => {
      await handleNoteUpdate(annotationId, content);
    },
    [handleNoteUpdate]
  );

  // Handle clicking on PDF to add sticky note
  const handlePdfClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (selectedTool !== 'sticky_note') return;

      const target = e.target as HTMLElement;
      const canvas = target.closest('.react-pdf__Page')?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Convert to normalized coordinates
      const normalizedX = x / canvas.width;
      const normalizedY = y / canvas.height;

      const position: StickyNotePosition = {
        x: normalizedX,
        y: normalizedY,
        width: 200,
        height: 150,
      };

      handleCreateStickyNote(pageNumber, position);
    },
    [selectedTool, pageNumber, handleCreateStickyNote]
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
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col" data-pmid={pmid}>
      {/* Custom CSS to make text layer invisible but selectable */}
      <style jsx global>{`
        .react-pdf__Page__textContent {
          opacity: 0 !important;
          pointer-events: auto !important;
        }
        .react-pdf__Page__textContent span {
          opacity: 0 !important;
        }
        /* Custom selection color for PDF text - make it subtle so our overlay is visible */
        .react-pdf__Page__textContent ::selection {
          background-color: rgba(59, 130, 246, 0.2);
          color: inherit;
        }
        .react-pdf__Page__textContent ::-moz-selection {
          background-color: rgba(59, 130, 246, 0.2);
          color: inherit;
        }
      `}</style>

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
              <div className="relative" onClick={handlePdfClick}>
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={false}
                  inputRef={(ref) => {
                    if (ref) {
                      ref.setAttribute('data-page-number', pageNumber.toString());
                    }
                  }}
                />

                {/* Highlight Layer - renders text-based annotations (highlight, underline, strikethrough) */}
                {projectId && (
                  <HighlightLayer
                    highlights={highlights.filter((h) =>
                      h.annotation_type === 'highlight' ||
                      h.annotation_type === 'underline' ||
                      h.annotation_type === 'strikethrough' ||
                      !h.annotation_type // Legacy highlights without type
                    )}
                    pageNumber={pageNumber}
                    scale={scale}
                    onHighlightClick={handleHighlightClick}
                  />
                )}

                {/* Sticky Notes Layer - renders sticky notes */}
                {projectId &&
                  highlights
                    .filter((h) => h.annotation_type === 'sticky_note')
                    .map((annotation) => (
                      <StickyNote
                        key={annotation.annotation_id}
                        annotation={annotation}
                        pageNumber={pageNumber}
                        scale={scale}
                        onMove={handleStickyNoteMove}
                        onResize={handleStickyNoteResize}
                        onEdit={handleStickyNoteEdit}
                        onDelete={handleHighlightDelete}
                      />
                    ))}
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

      {/* Annotation Toolbar - vertical toolbar with annotation tools */}
      {projectId && highlightMode && (
        <AnnotationToolbar
          selectedTool={selectedTool}
          onToolSelect={setSelectedTool}
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          isEnabled={highlightMode}
        />
      )}

      {/* Highlight Tool - color picker for text selection */}
      {/* HighlightTool (color picker popup) - Disabled in favor of drag-to-highlight */}
      {/* {projectId && (selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <HighlightTool
          onHighlight={handleHighlight}
          isEnabled={highlightMode}
        />
      )} */}

      {/* Selection Overlay - real-time highlight with selected color during text selection */}
      {projectId && (selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <SelectionOverlay
          isEnabled={highlightMode}
          selectedColor={selectedColor || HIGHLIGHT_COLORS[0].hex}
          onSelectionComplete={handleDragToHighlight}
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

