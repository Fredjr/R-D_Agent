'use client';

import { useEffect, useState, useRef } from 'react';
import type { Highlight, PDFCoordinates } from '@/types/pdf-annotations';

interface HighlightLayerProps {
  highlights: Highlight[];
  pageNumber: number;
  scale: number;
  onHighlightClick?: (highlight: Highlight) => void;
}

export default function HighlightLayer({
  highlights,
  pageNumber,
  scale,
  onHighlightClick,
}: HighlightLayerProps) {
  const [pageRect, setPageRect] = useState<DOMRect | null>(null);
  const layerRef = useRef<HTMLDivElement>(null);

  // Get page dimensions when component mounts or page changes
  useEffect(() => {
    const updatePageRect = () => {
      const pageElement = document.querySelector(
        `.react-pdf__Page[data-page-number="${pageNumber}"]`
      );
      
      if (pageElement) {
        const rect = pageElement.getBoundingClientRect();
        setPageRect(rect);
      }
    };

    // Initial update
    updatePageRect();

    // Update on window resize
    window.addEventListener('resize', updatePageRect);
    
    // Update after a short delay to ensure PDF is rendered
    const timer = setTimeout(updatePageRect, 100);

    return () => {
      window.removeEventListener('resize', updatePageRect);
      clearTimeout(timer);
    };
  }, [pageNumber, scale]);

  // Filter highlights for current page
  const pageHighlights = highlights.filter((h) => h.pdf_page === pageNumber);

  if (!pageRect || pageHighlights.length === 0) {
    return null;
  }

  // Convert normalized coordinates to pixel coordinates
  const getPixelCoordinates = (coords: PDFCoordinates) => {
    // The PDF page is rendered at a specific scale
    // We need to convert normalized coordinates (0-1) to actual pixel positions
    const pageElement = document.querySelector(
      `.react-pdf__Page[data-page-number="${pageNumber}"] canvas`
    ) as HTMLCanvasElement;

    if (!pageElement) {
      return null;
    }

    const canvasWidth = pageElement.width;
    const canvasHeight = pageElement.height;

    // Calculate pixel positions
    const x = coords.x * canvasWidth;
    const y = coords.y * canvasHeight;
    const width = coords.width * canvasWidth;
    const height = coords.height * canvasHeight;

    return { x, y, width, height };
  };

  return (
    <div
      ref={layerRef}
      className="absolute inset-0 pointer-events-none z-10"
      style={{
        width: pageRect.width,
        height: pageRect.height,
      }}
    >
      {pageHighlights.map((highlight) => {
        const pixelCoords = getPixelCoordinates(highlight.pdf_coordinates);
        
        if (!pixelCoords) {
          return null;
        }

        return (
          <div
            key={highlight.annotation_id}
            className="absolute pointer-events-auto cursor-pointer transition-opacity hover:opacity-80"
            style={{
              left: `${pixelCoords.x}px`,
              top: `${pixelCoords.y}px`,
              width: `${pixelCoords.width}px`,
              height: `${pixelCoords.height}px`,
              backgroundColor: highlight.highlight_color,
              opacity: 0.4,
              mixBlendMode: 'multiply',
            }}
            onClick={() => onHighlightClick?.(highlight)}
            title={highlight.highlight_text}
          />
        );
      })}
    </div>
  );
}

