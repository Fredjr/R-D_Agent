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
import PDFSidebarTabs from './PDFSidebarTabs';
import StickyNote from './StickyNote';
import AnnotationToolbar from './AnnotationToolbar';
import TopActionBar from './TopActionBar';
import RightAnnotationToolbar from './RightAnnotationToolbar';
import BottomColorBar from './BottomColorBar';
import TwoClickSelector from './TwoClickSelector';
import FreeformDrawing from './FreeformDrawing';
import PDFControlsToolbar from './PDFControlsToolbar';
import PageThumbnailsSidebar from './PageThumbnailsSidebar';
import PDFSearchSidebar from './PDFSearchSidebar';
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
  collectionId?: string; // NEW: Collection context for annotations
  onClose: () => void;
  onViewInNetwork?: () => void; // NEW: Callback to open paper in network view
}

export default function PDFViewer({ pmid, title, projectId, collectionId, onClose, onViewInNetwork }: PDFViewerProps) {
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

  // NEW: Cochrane-style UI state
  const [showAnnotateMode, setShowAnnotateMode] = useState<boolean>(false);
  const [showRightToolbar, setShowRightToolbar] = useState<boolean>(false);
  const [addNoteEnabled, setAddNoteEnabled] = useState<boolean>(false);

  // Exploration panel state
  const [showExplorePanel, setShowExplorePanel] = useState<boolean>(false);
  const [explorationMode, setExplorationMode] = useState<'citations' | 'references' | 'similar' | null>(null);
  const [explorationResults, setExplorationResults] = useState<any[]>([]);
  const [loadingExploration, setLoadingExploration] = useState<boolean>(false);

  // NEW: PDF Controls state (Cochrane-style)
  const [rotation, setRotation] = useState<number>(0);
  const [showThumbnails, setShowThumbnails] = useState<boolean>(false);
  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [currentSearchResultIndex, setCurrentSearchResultIndex] = useState<number>(0);

  // WebSocket for real-time annotation updates
  useAnnotationWebSocket({
    projectId: projectId || '',
    userId: user?.email,
    onNewAnnotation: (annotation) => {
      console.log('📥 New annotation received via WebSocket:', annotation);
      console.log('   Current PDF PMID:', pmid);
      console.log('   Annotation PMID:', annotation.article_pmid);
      console.log('   PMID Match:', annotation.article_pmid === pmid);

      // Only add if it matches current PMID
      if (annotation.article_pmid === pmid) {
        console.log('   ✅ Adding annotation to highlights');
        setHighlights((prev) => {
          // Avoid duplicates
          if (prev.some((a) => a.annotation_id === annotation.annotation_id)) {
            console.log('   ⚠️ Annotation already exists, skipping');
            return prev;
          }
          // Cast Annotation to Highlight (they're now compatible)
          console.log('   ✅ Annotation added to state');
          return [...prev, annotation as Highlight];
        });
      } else {
        console.log('   ❌ PMID mismatch - annotation not added to this PDF');
      }
    },
    onUpdateAnnotation: (annotation) => {
      console.log('📥 Updated annotation received via WebSocket:', annotation);
      // Update if it matches current PMID
      if (annotation.article_pmid === pmid) {
        setHighlights((prev) =>
          prev.map((h) => (h.annotation_id === annotation.annotation_id ? annotation as Highlight : h))
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
        // Close search/thumbnails first, then close PDF viewer
        if (showSearch) {
          setShowSearch(false);
          setSearchQuery('');
          setSearchResults([]);
        } else if (showThumbnails) {
          setShowThumbnails(false);
        } else {
          onClose();
        }
      } else if (e.key === 'f' && (e.metaKey || e.ctrlKey)) {
        // Cmd/Ctrl + F to open search
        e.preventDefault();
        handleToggleSearch();
      } else if (e.key === 'h' && (e.metaKey || e.ctrlKey)) {
        // Cmd/Ctrl + H to toggle highlight mode
        e.preventDefault();
        setHighlightMode((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages, showSearch, showThumbnails]);

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
          console.log('📄 Using PDF proxy:', proxyUrl);
          setPdfUrl(proxyUrl);
        }
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

  // NEW: PDF Controls handlers
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleFitWidth = () => {
    // Calculate scale to fit page width
    const container = document.querySelector('.pdf-page-container');
    if (container) {
      const containerWidth = container.clientWidth - 40; // Account for padding
      const pageWidth = 612; // Standard PDF page width in points
      const newScale = containerWidth / pageWidth;
      setScale(Math.max(0.5, Math.min(newScale, 3.0)));
    }
  };

  const handleToggleThumbnails = () => {
    const newShowThumbnails = !showThumbnails;
    setShowThumbnails(newShowThumbnails);

    if (newShowThumbnails) {
      // Opening thumbnails - close other sidebars
      setShowSearch(false);
      setShowSidebar(false);
    }
  };

  const handleToggleSearch = () => {
    const newShowSearch = !showSearch;
    setShowSearch(newShowSearch);

    if (newShowSearch) {
      // Opening search - close other sidebars
      setShowThumbnails(false);
      setShowSidebar(false);
    }
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    if (!query.trim()) {
      setSearchResults([]);
      setCurrentSearchResultIndex(0);
      return;
    }

    // TODO: Implement actual PDF text search using PDF.js
    // For now, simulate search results
    const mockResults = Array.from({ length: 10 }, (_, i) => ({
      pageNumber: Math.floor(Math.random() * numPages) + 1,
      text: `This is a sample text containing ${query} in the PDF document. Lorem ipsum dolor sit amet, consectetur adipiscing elit.`,
      index: i,
    }));

    setSearchResults(mockResults);
    setCurrentSearchResultIndex(0);
  };

  const handleSearchResultClick = (pageNumber: number, index: number) => {
    setPageNumber(pageNumber);
    setCurrentSearchResultIndex(index);
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

      // ✅ FIX: Include both text-based annotations (with pdf_coordinates) AND sticky notes (with sticky_note_position)
      const pdfAnnotations = (data.annotations || []).filter(
        (a: any) => {
          // Text-based annotations (highlight, underline, strikethrough) need pdf_coordinates
          const hasTextAnnotationData = a.pdf_page !== null && a.pdf_coordinates !== null;

          // Sticky notes need pdf_page and sticky_note_position
          const hasStickyNoteData = a.annotation_type === 'sticky_note' && a.pdf_page !== null && a.sticky_note_position !== null;

          return hasTextAnnotationData || hasStickyNoteData;
        }
      );

      setHighlights(pdfAnnotations);
      console.log(`✅ Loaded ${pdfAnnotations.length} annotations (${pdfAnnotations.filter((a: any) => a.annotation_type === 'sticky_note').length} sticky notes, ${pdfAnnotations.filter((a: any) => a.annotation_type !== 'sticky_note').length} text annotations)`);
    } catch (err) {
      console.error('❌ Error fetching highlights:', err);
    } finally {
      setLoadingHighlights(false);
    }
  };

  // ✅ FIX: Helper function to check if two text selections overlap
  const doSelectionsOverlap = (
    selection1: { pageNumber: number; text: string },
    selection2: { pdf_page: number; highlight_text: string | null }
  ): boolean => {
    // Must be on same page
    if (selection1.pageNumber !== selection2.pdf_page) return false;

    // Must have overlapping text
    if (!selection2.highlight_text) return false;

    const text1 = selection1.text.trim().toLowerCase();
    const text2 = selection2.highlight_text.trim().toLowerCase();

    // Check if texts overlap (either contains the other, or are identical)
    return text1.includes(text2) || text2.includes(text1) || text1 === text2;
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

        // ✅ FIX: Check for overlapping annotations and delete them first
        // This prevents multiple annotation types on the same text
        const overlappingAnnotations = highlights.filter((h) =>
          doSelectionsOverlap(selection, h) &&
          (h.annotation_type === 'highlight' ||
           h.annotation_type === 'underline' ||
           h.annotation_type === 'strikethrough')
        );

        if (overlappingAnnotations.length > 0) {
          console.log(`🗑️ Found ${overlappingAnnotations.length} overlapping annotations - deleting them first`);

          // Delete all overlapping annotations
          for (const annotation of overlappingAnnotations) {
            try {
              await fetch(`/api/proxy/projects/${projectId}/annotations/${annotation.annotation_id}`, {
                method: 'DELETE',
                headers: {
                  'User-ID': user.email,
                },
              });
              console.log(`✅ Deleted overlapping annotation: ${annotation.annotation_id}`);
            } catch (err) {
              console.error(`❌ Failed to delete annotation ${annotation.annotation_id}:`, err);
            }
          }

          // Remove from local state
          setHighlights((prev) =>
            prev.filter((h) => !overlappingAnnotations.some((oa) => oa.annotation_id === h.annotation_id))
          );
        }

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
        // ✅ FIX: note_type should always be 'highlight' for text-based annotations
        // annotation_type differentiates between highlight/underline/strikethrough
        const annotationData = {
          content: `${annotationType}: ${selection.text}`,
          article_pmid: pmid,
          collection_id: collectionId, // ✅ NEW: Link annotation to collection if in collection context
          note_type: 'highlight', // Always 'highlight' for text-based annotations
          priority: 'medium',
          status: 'active',
          pdf_page: selection.pageNumber,
          pdf_coordinates: coordinates,
          highlight_color: color,
          highlight_text: selection.text,
          annotation_type: annotationType, // This differentiates highlight/underline/strikethrough
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
    [projectId, user, pmid, selectedTool, highlights, collectionId]
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
        console.log('🗑️ Deleting annotation:', annotationId);

        const response = await fetch(`/api/proxy/projects/${projectId}/annotations/${annotationId}`, {
          method: 'DELETE',
          headers: {
            'User-ID': user.email,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Failed to delete annotation:', {
            status: response.status,
            error: errorData,
            annotationId,
          });

          // ✅ FIX: If annotation not found (404), still remove it from local state
          if (response.status === 404) {
            console.log('🗑️ Annotation not found in backend - removing from local state anyway');
            setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
            return; // Don't show error to user
          }

          throw new Error(`Failed to delete annotation: ${errorData.error || response.statusText}`);
        }

        console.log('✅ Annotation deleted successfully:', annotationId);

        // Remove from local state
        setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
      } catch (err) {
        console.error('❌ Error deleting annotation:', err);
        alert('Failed to delete annotation. Please try again.');
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
        console.log('📝 Adding/updating note:', { annotationId, note: note.substring(0, 50) });

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
          const errorData = await response.json();
          console.error('❌ Failed to add/update note:', {
            status: response.status,
            error: errorData,
            annotationId,
          });

          // ✅ FIX: If annotation not found (404), remove it from local state
          if (response.status === 404) {
            console.log('🗑️ Annotation not found in backend - removing from local state');
            setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
          }

          throw new Error(`Failed to add note: ${errorData.error || response.statusText}`);
        }

        const updatedAnnotation = await response.json();
        console.log('✅ Note added/updated successfully:', annotationId);

        // ✅ FIX: Update local state with the full response from backend
        // This ensures we have the correct data structure
        setHighlights((prev) =>
          prev.map((h) => (h.annotation_id === annotationId ? updatedAnnotation as Highlight : h))
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
          content: 'Type to add note...',
          article_pmid: pmid,
          collection_id: collectionId, // ✅ NEW: Link annotation to collection if in collection context
          note_type: 'general',
          pdf_page: pageNum,
          annotation_type: 'sticky_note',
          sticky_note_position: position,
          sticky_note_color: '#FFEB3B',
        };

        console.log('📝 Creating sticky note:', annotationData);

        const response = await fetch(`/api/proxy/projects/${projectId}/annotations`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': user.email,
          },
          body: JSON.stringify(annotationData),
        });

        if (!response.ok) {
          const errorData = await response.json();
          console.error('❌ Failed to create sticky note:', errorData);
          throw new Error(`Failed to create sticky note: ${errorData.error || response.statusText}`);
        }

        const newAnnotation = await response.json();
        console.log('✅ Sticky note created successfully:', {
          annotation_id: newAnnotation.annotation_id,
          pmid: newAnnotation.article_pmid,
          page: newAnnotation.pdf_page,
        });

        // ✅ FIX: Don't add to local state here - let WebSocket handle it
        // This prevents duplicates when WebSocket broadcast arrives
        // setHighlights((prev) => [...prev, newAnnotation]);
      } catch (err) {
        console.error('❌ Error creating sticky note:', err);
        alert('Failed to create sticky note. Please try again.');
      }
    },
    [projectId, user, pmid, collectionId]
  );

  // Handle moving a sticky note
  const handleStickyNoteMove = useCallback(
    async (annotationId: string, newPosition: StickyNotePosition) => {
      if (!projectId || !user) return;

      try {
        console.log('📍 Moving sticky note:', { annotationId, newPosition });

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
          const errorData = await response.json();
          console.error('❌ Failed to move sticky note:', {
            status: response.status,
            error: errorData,
            annotationId,
          });

          // ✅ FIX: If annotation not found (404), remove it from local state
          if (response.status === 404) {
            console.log('🗑️ Annotation not found in backend - removing from local state');
            setHighlights((prev) => prev.filter((h) => h.annotation_id !== annotationId));
          }

          throw new Error(`Failed to move sticky note: ${errorData.error || response.statusText}`);
        }

        console.log('✅ Sticky note moved successfully:', annotationId);

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
      console.log('✏️ Editing sticky note:', { annotationId, content: content.substring(0, 50) });
      await handleNoteUpdate(annotationId, content);
    },
    [handleNoteUpdate]
  );

  // Exploration functions
  const fetchExplorationData = useCallback(
    async (mode: 'citations' | 'references' | 'similar') => {
      setLoadingExploration(true);
      setExplorationMode(mode);
      setShowExplorePanel(true);

      try {
        let endpoint = '';
        if (mode === 'citations') {
          endpoint = `/api/proxy/articles/${pmid}/citations`;
        } else if (mode === 'references') {
          endpoint = `/api/proxy/articles/${pmid}/references`;
        } else if (mode === 'similar') {
          endpoint = `/api/proxy/articles/${pmid}/similar`;
        }

        const response = await fetch(endpoint);
        if (!response.ok) {
          throw new Error(`Failed to fetch ${mode}`);
        }

        const data = await response.json();
        setExplorationResults(data.articles || data.results || []);
      } catch (err) {
        console.error(`Error fetching ${mode}:`, err);
        setExplorationResults([]);
      } finally {
        setLoadingExploration(false);
      }
    },
    [pmid]
  );

  // Handle tool selection - automatically enable highlight mode for text-based tools
  const handleToolSelect = useCallback((tool: AnnotationType | null) => {
    setSelectedTool(tool);

    // ✅ FIX: Automatically enable highlight mode when selecting text-based annotation tools
    if (tool === 'highlight' || tool === 'underline' || tool === 'strikethrough') {
      setHighlightMode(true);
    } else if (tool === null) {
      // Disable highlight mode when deselecting tool
      setHighlightMode(false);
    }
    // Note: sticky_note doesn't need highlight mode
  }, []);

  // NEW: Handle annotate mode toggle (Cochrane-style)
  const handleAnnotateToggle = useCallback(() => {
    const newState = !showAnnotateMode;
    setShowAnnotateMode(newState);
    setShowRightToolbar(newState);

    // If disabling, clear selected tool
    if (!newState) {
      setSelectedTool(null);
      setHighlightMode(false);
    }
  }, [showAnnotateMode]);

  // NEW: Handle drawing complete
  const handleDrawingComplete = useCallback(
    async (drawingData: any) => {
      if (!projectId || !user) return;

      try {
        console.log('🎨 Drawing completed:', drawingData);

        const annotationData = {
          content: 'Freeform drawing',
          article_pmid: pmid,
          collection_id: collectionId,
          note_type: 'highlight',
          priority: 'medium',
          status: 'active',
          pdf_page: drawingData.pageNumber,
          annotation_type: 'drawing',
          drawing_data: JSON.stringify(drawingData.paths),
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
          throw new Error('Failed to create drawing');
        }

        const newAnnotation = await response.json();
        console.log('✅ Drawing created:', newAnnotation.annotation_id);

        setHighlights((prev) => [...prev, newAnnotation]);
      } catch (err) {
        console.error('❌ Error creating drawing:', err);
      }
    },
    [projectId, user, pmid, collectionId]
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

      {/* NEW: Top Action Bar - Cochrane-style */}
      <TopActionBar
        onAnnotateToggle={handleAnnotateToggle}
        isAnnotateActive={showAnnotateMode}
        onClose={onClose}
        title={title || `PMID: ${pmid}`}
      />

      {/* Secondary Navigation Bar - Page controls and zoom */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-4">
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
        </div>

        {/* Stats */}
        {projectId && highlights.length > 0 && (
          <span className="text-xs text-gray-600">
            {highlights.length} annotation{highlights.length !== 1 ? 's' : ''}
          </span>
        )}
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
                  rotate={rotation}
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

        {/* Annotations Sidebar - Tabs */}
        {projectId && showSidebar && !showThumbnails && !showSearch && (
          <div className="w-[30%] h-full overflow-y-auto flex flex-col">
            {/* Exploration Section */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border-b border-purple-200 p-4">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-base">🔍</span>
                Explore Connections
              </h3>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => fetchExplorationData('citations')}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 border border-blue-300 transition-all hover:scale-[1.02] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>📊</span>
                    <span>View Citations</span>
                  </span>
                </button>
                <button
                  onClick={() => fetchExplorationData('references')}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-green-100 text-green-700 hover:bg-green-200 border border-green-300 transition-all hover:scale-[1.02] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>📚</span>
                    <span>View References</span>
                  </span>
                </button>
                <button
                  onClick={() => fetchExplorationData('similar')}
                  className="w-full px-3 py-2 text-sm rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 border border-purple-300 transition-all hover:scale-[1.02] flex items-center justify-between"
                >
                  <span className="flex items-center gap-2">
                    <span>🔍</span>
                    <span>Find Similar Papers</span>
                  </span>
                </button>
              </div>
            </div>

            {/* Annotations with Tabs */}
            <div className="flex-1 overflow-hidden">
              <PDFSidebarTabs
                highlights={highlights}
                currentPage={pageNumber}
                onHighlightClick={handleHighlightClick}
                onHighlightDelete={handleHighlightDelete}
                onHighlightColorChange={handleHighlightColorChange}
                onNoteAdd={handleNoteAdd}
                onNoteUpdate={handleNoteUpdate}
                pmid={pmid}
                projectId={projectId}
                collectionId={collectionId}
                userId={user?.user_id}
                pdfUrl={pdfUrl || undefined}
                onViewPDF={(newPmid) => {
                  // Open new PDF in same viewer
                  window.location.href = `/project/${projectId}/pdf/${newPmid}${collectionId ? `?collectionId=${collectionId}` : ''}`;
                }}
                onAddToCollection={(newPmid) => {
                  console.log('Add to collection:', newPmid);
                }}
                onPageNavigate={(page) => {
                  setPageNumber(page);
                }}
              />
            </div>
          </div>
        )}

        {/* NEW: Page Thumbnails Sidebar - Cochrane-style */}
        {showThumbnails && pdfUrl && (
          <PageThumbnailsSidebar
            pdfUrl={pdfUrl}
            numPages={numPages}
            currentPage={pageNumber}
            onPageClick={(page) => setPageNumber(page)}
            onClose={() => setShowThumbnails(false)}
          />
        )}

        {/* NEW: PDF Search Sidebar - Cochrane-style */}
        {showSearch && pdfUrl && (
          <PDFSearchSidebar
            pdfUrl={pdfUrl}
            numPages={numPages}
            currentPage={pageNumber}
            onResultClick={handleSearchResultClick}
            onClose={() => {
              setShowSearch(false);
              setSearchQuery('');
              setSearchResults([]);
            }}
            onSearchQueryChange={handleSearchQueryChange}
            searchResults={searchResults}
            currentResultIndex={currentSearchResultIndex}
          />
        )}

        {/* Exploration Results Panel - Fixed position, always visible */}
        {showExplorePanel && (
          <div className="fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-300 shadow-2xl z-[60] flex flex-col">
            {/* Panel Header */}
            <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between flex-shrink-0">
              <div>
                <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  {explorationMode === 'citations' && <><span>📊</span> Citations</>}
                  {explorationMode === 'references' && <><span>📚</span> References</>}
                  {explorationMode === 'similar' && <><span>🔍</span> Similar Papers</>}
                </h3>
                {!loadingExploration && (
                  <p className="text-xs text-gray-600 mt-1">
                    {explorationResults.length} papers found
                  </p>
                )}
              </div>
              <button
                onClick={() => {
                  setShowExplorePanel(false);
                  setExplorationMode(null);
                  setExplorationResults([]);
                }}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-700" />
              </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {loadingExploration ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                </div>
              ) : explorationResults.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-gray-600">No results found</p>
                </div>
              ) : (
                explorationResults.map((paper, index) => (
                  <div
                    key={index}
                    className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-all"
                    onClick={() => {
                      if (onViewInNetwork) {
                        // Close PDF and open this paper in network
                        onViewInNetwork();
                        onClose();
                      }
                    }}
                  >
                    <h4 className="font-medium text-sm text-gray-900 mb-1 line-clamp-2">
                      {paper.title || 'Untitled'}
                    </h4>
                    {paper.authors && paper.authors.length > 0 && (
                      <p className="text-xs text-gray-600 mb-1">
                        {paper.authors.slice(0, 3).join(', ')}
                        {paper.authors.length > 3 && ' et al.'}
                      </p>
                    )}
                    <p className="text-xs text-gray-500">
                      {paper.journal && `${paper.journal} • `}
                      {paper.year}
                      {paper.citation_count && ` • ${paper.citation_count} citations`}
                    </p>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewInNetwork) {
                          onViewInNetwork();
                          onClose();
                        }
                      }}
                      className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
                    >
                      View in Network →
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* NEW: Right Annotation Toolbar - Cochrane-style vertical toolbar on right */}
      {projectId && (
        <RightAnnotationToolbar
          selectedTool={selectedTool}
          onToolSelect={handleToolSelect}
          isVisible={showRightToolbar}
          onClose={() => {
            setShowRightToolbar(false);
            setShowAnnotateMode(false);
            setSelectedTool(null);
            setHighlightMode(false);
          }}
        />
      )}

      {/* NEW: Bottom Color Bar - Shows when color tool is selected */}
      {projectId && (selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <BottomColorBar
          selectedColor={selectedColor}
          onColorSelect={setSelectedColor}
          isVisible={showAnnotateMode}
          showAddNote={true}
          onAddNoteToggle={setAddNoteEnabled}
        />
      )}

      {/* NEW: Two-Click Selector - Cochrane-style pen cursor selection */}
      {projectId && (selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <TwoClickSelector
          isEnabled={highlightMode && showAnnotateMode}
          selectedTool={selectedTool}
          selectedColor={selectedColor}
          onSelectionComplete={handleDragToHighlight}
        />
      )}

      {/* NEW: Freeform Drawing Tool */}
      {projectId && selectedTool === 'drawing' && (
        <FreeformDrawing
          isEnabled={showAnnotateMode}
          selectedColor={selectedColor}
          pageNumber={pageNumber}
          onDrawingComplete={handleDrawingComplete}
        />
      )}

      {/* OLD: Keep Selection Overlay as fallback when not in annotate mode */}
      {projectId && !showAnnotateMode && (selectedTool === 'highlight' || selectedTool === 'underline' || selectedTool === 'strikethrough') && (
        <SelectionOverlay
          isEnabled={highlightMode}
          selectedColor={selectedColor || HIGHLIGHT_COLORS[0].hex}
          onSelectionComplete={handleDragToHighlight}
        />
      )}

      {/* NEW: PDF Controls Toolbar - Cochrane-style bottom-right controls */}
      <PDFControlsToolbar
        zoom={scale}
        onZoomIn={zoomIn}
        onZoomOut={zoomOut}
        onRotate={handleRotate}
        onFitWidth={handleFitWidth}
        onToggleThumbnails={handleToggleThumbnails}
        onToggleSearch={handleToggleSearch}
        showThumbnails={showThumbnails}
        showSearch={showSearch}
      />

      {/* Footer with keyboard shortcuts */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <p className="text-xs text-gray-500 text-center">
          Keyboard shortcuts: ← → (navigate pages) | Esc (close search/thumbnails) | Cmd/Ctrl+F (search) | Cmd/Ctrl+H (toggle highlight mode)
        </p>
      </div>
    </div>
  );
}

