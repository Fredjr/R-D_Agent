'use client';

import React, { useEffect, useState } from 'react';
import { pdfjs } from 'react-pdf';

interface SearchMatch {
  pageNumber: number;
  text: string;
  index: number;
  matchIndex?: number;
}

interface TextRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SearchHighlightLayerProps {
  pdfDocument: any;
  searchQuery: string;
  searchResults: SearchMatch[];
  currentResultIndex: number;
  pageNumber: number;
  scale: number;
}

export default function SearchHighlightLayer({
  pdfDocument,
  searchQuery,
  searchResults,
  currentResultIndex,
  pageNumber,
  scale,
}: SearchHighlightLayerProps) {
  const [highlights, setHighlights] = useState<TextRect[]>([]);
  const [currentHighlight, setCurrentHighlight] = useState<number>(-1);

  useEffect(() => {
    if (!pdfDocument || !searchQuery || searchResults.length === 0) {
      setHighlights([]);
      setCurrentHighlight(-1);
      return;
    }

    extractTextPositions();
  }, [pdfDocument, searchQuery, pageNumber, scale, searchResults]);

  useEffect(() => {
    // Update current highlight based on currentResultIndex
    const currentResult = searchResults[currentResultIndex];
    if (currentResult && currentResult.pageNumber === pageNumber) {
      // Find which highlight on this page corresponds to the current result
      const pageResults = searchResults.filter(r => r.pageNumber === pageNumber);
      const indexOnPage = pageResults.findIndex(r => r.index === currentResult.index);
      setCurrentHighlight(indexOnPage);
    } else {
      setCurrentHighlight(-1);
    }
  }, [currentResultIndex, searchResults, pageNumber]);

  const extractTextPositions = async () => {
    try {
      const page = await pdfDocument.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1 }); // Get unscaled viewport

      const searchTerm = searchQuery.toLowerCase();
      const rects: TextRect[] = [];

      // Build full text with positions
      let fullText = '';
      const itemPositions: Array<{ start: number; end: number; item: any }> = [];

      textContent.items.forEach((item: any) => {
        const start = fullText.length;
        fullText += item.str;
        const end = fullText.length;
        itemPositions.push({ start, end, item });
        fullText += ' '; // Add space between items
      });

      // Find all matches in the full text
      const lowerFullText = fullText.toLowerCase();
      let startIndex = 0;

      while (true) {
        const matchIndex = lowerFullText.indexOf(searchTerm, startIndex);
        if (matchIndex === -1) break;

        const matchEnd = matchIndex + searchTerm.length;

        // Find which text items contain this match
        const matchingItems = itemPositions.filter(
          (pos) => pos.start <= matchIndex && pos.end >= matchIndex
        );

        if (matchingItems.length > 0) {
          // For simplicity, use the first matching item's bounds
          const item = matchingItems[0].item;
          
          if (item.transform && item.width && item.height) {
            const tx = item.transform[4];
            const ty = item.transform[5];
            
            // Convert PDF coordinates to canvas coordinates
            const x = tx;
            const y = viewport.height - ty - item.height;
            
            rects.push({
              x: x * scale,
              y: y * scale,
              width: item.width * scale,
              height: item.height * scale,
            });
          }
        }

        startIndex = matchIndex + 1;
      }

      setHighlights(rects);
    } catch (error) {
      console.error('Error extracting text positions:', error);
      setHighlights([]);
    }
  };

  if (highlights.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 2 }}>
      {highlights.map((rect, index) => (
        <div
          key={index}
          className={`absolute transition-all ${
            index === currentHighlight
              ? 'bg-orange-400 opacity-70'
              : 'bg-yellow-300 opacity-50'
          }`}
          style={{
            left: `${rect.x}px`,
            top: `${rect.y}px`,
            width: `${rect.width}px`,
            height: `${rect.height}px`,
          }}
        />
      ))}
    </div>
  );
}

