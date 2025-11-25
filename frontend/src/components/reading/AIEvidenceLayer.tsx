'use client';

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAIEvidenceForPaper, type AIEvidence } from '@/lib/api/evidence';
import { findTextInPDF, type TextMatch } from '@/lib/pdf-text-search';

interface AIHighlight extends AIEvidence, TextMatch {}

interface AIEvidenceLayerProps {
  pmid: string;
  projectId?: string;
  pdfDocument: any;  // PDF.js document
  pageNumber: number;
  scale: number;
  onEvidenceClick?: (evidence: AIEvidence) => void;
}

/**
 * Phase 2.1: AI Evidence Layer
 * 
 * Automatically highlights AI-extracted evidence in purple.
 * Shows tooltips with hypothesis information on hover.
 */
export default function AIEvidenceLayer({
  pmid,
  projectId,
  pdfDocument,
  pageNumber,
  scale,
  onEvidenceClick,
}: AIEvidenceLayerProps) {
  const [aiHighlights, setAiHighlights] = useState<AIHighlight[]>([]);
  const [loading, setLoading] = useState(false);
  const [pageRect, setPageRect] = useState<DOMRect | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  // Get page dimensions
  useEffect(() => {
    const updatePageRect = () => {
      const pageElement = document.querySelector(
        `.react-pdf__Page[data-page-number="${pageNumber}"] canvas`
      ) as HTMLCanvasElement;

      if (pageElement) {
        setPageRect(pageElement.getBoundingClientRect());
      }
    };

    updatePageRect();
    window.addEventListener('resize', updatePageRect);
    return () => window.removeEventListener('resize', updatePageRect);
  }, [pageNumber, scale]);

  // Load AI evidence and find matches in PDF
  useEffect(() => {
    if (!projectId || !pdfDocument || !user?.email) {
      return;
    }

    loadAIEvidence();
  }, [pmid, projectId, pdfDocument, user?.email]);

  async function loadAIEvidence() {
    if (!projectId || !user?.email) return;

    setLoading(true);
    console.log(`🤖 Loading AI evidence for paper ${pmid}`);

    try {
      // Step 1: Fetch AI evidence from triage data
      const evidence = await fetchAIEvidenceForPaper(projectId, pmid, user.email);

      if (evidence.length === 0) {
        console.log(`ℹ️ No AI evidence found for paper ${pmid}`);
        setAiHighlights([]);
        return;
      }

      console.log(`✅ Found ${evidence.length} AI evidence excerpts`);

      // Step 2: Search for each quote in PDF
      const highlights: AIHighlight[] = [];

      for (const e of evidence) {
        try {
          const matches = await findTextInPDF(pdfDocument, e.quote, 10); // Search first 10 pages

          if (matches.length > 0) {
            // Use first match (evidence is usually unique)
            const match = matches[0];
            highlights.push({
              ...e,
              ...match,
            });
            console.log(`✅ Found match for evidence on page ${match.page}`);
          } else {
            console.log(`⚠️ No match found for evidence: "${e.quote.substring(0, 50)}..."`);
          }
        } catch (error) {
          console.error(`❌ Error searching for evidence:`, error);
        }
      }

      setAiHighlights(highlights);
      console.log(`✅ Created ${highlights.length} AI highlights`);

    } catch (error) {
      console.error('❌ Error loading AI evidence:', error);
      setAiHighlights([]);
    } finally {
      setLoading(false);
    }
  }

  // Filter highlights for current page
  const pageHighlights = aiHighlights.filter((h) => h.page === pageNumber);

  if (!pageRect || pageHighlights.length === 0) {
    return null;
  }

  // Convert normalized coordinates to pixel coordinates
  const getPixelCoordinates = (highlight: AIHighlight) => {
    const pageElement = document.querySelector(
      `.react-pdf__Page[data-page-number="${pageNumber}"] canvas`
    ) as HTMLCanvasElement;

    if (!pageElement) {
      return null;
    }

    // Scale coordinates
    return {
      x: highlight.x * scale,
      y: highlight.y * scale,
      width: highlight.width * scale,
      height: highlight.height * scale,
    };
  };

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex: 5, // Below user highlights (z-index: 10) but above PDF
      }}
    >
      {pageHighlights.map((highlight, index) => {
        const coords = getPixelCoordinates(highlight);

        if (!coords) {
          return null;
        }

        const tooltipText = [
          `🤖 AI Evidence`,
          highlight.hypothesis_text ? `Supports: ${highlight.hypothesis_text}` : null,
          highlight.relevance ? `Relevance: ${highlight.relevance}` : null,
        ]
          .filter(Boolean)
          .join('\n');

        return (
          <div
            key={`ai-evidence-${index}`}
            className="absolute pointer-events-auto cursor-help transition-opacity hover:opacity-90"
            style={{
              left: `${coords.x}px`,
              top: `${coords.y}px`,
              width: `${coords.width}px`,
              height: `${coords.height}px`,
              backgroundColor: 'rgba(147, 51, 234, 0.25)', // Purple with transparency
              border: '1.5px solid rgba(147, 51, 234, 0.6)',
              borderRadius: '2px',
            }}
            title={tooltipText}
            onClick={() => onEvidenceClick?.(highlight)}
          />
        );
      })}

      {/* Loading indicator */}
      {loading && (
        <div className="absolute top-2 right-2 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-xs font-medium shadow-sm">
          🤖 Loading AI evidence...
        </div>
      )}
    </div>
  );
}

