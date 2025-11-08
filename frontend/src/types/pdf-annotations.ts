/**
 * Type definitions for PDF annotations and highlights
 * Week 11 Day 2 - Frontend Highlight Tool
 */

export interface PDFCoordinates {
  x: number;          // Normalized X position (0-1)
  y: number;          // Normalized Y position (0-1)
  width: number;      // Normalized width (0-1)
  height: number;     // Normalized height (0-1)
  pageWidth: number;  // Original page width in points
  pageHeight: number; // Original page height in points
}

export interface StickyNotePosition {
  x: number;          // Normalized X position (0-1)
  y: number;          // Normalized Y position (0-1)
  width: number;      // Width in pixels
  height: number;     // Height in pixels
}

export interface TextFormatting {
  bold?: boolean;
  underline?: boolean;
  italic?: boolean;
  strikethrough?: boolean;
}

export type AnnotationType = 'highlight' | 'sticky_note' | 'underline' | 'strikethrough' | 'drawing';

export interface Highlight {
  annotation_id: string;
  pdf_page: number;
  pdf_coordinates: PDFCoordinates | null;
  highlight_color: string | null;
  highlight_text: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  author_id: string;

  // Advanced annotation fields
  annotation_type: AnnotationType;
  sticky_note_position: StickyNotePosition | null;
  sticky_note_color: string;
  text_formatting: TextFormatting | null;
  drawing_data: any | null;

  // Organization fields
  tags?: string[];
  note_type?: string;
  priority?: string;
  status?: string;
}

export interface TextSelection {
  text: string;
  pageNumber: number;
  boundingRect: DOMRect;
  rects: DOMRect[];
}

export const HIGHLIGHT_COLORS = [
  { name: 'Yellow', hex: '#FFEB3B', bg: 'bg-yellow-300', hover: 'hover:bg-yellow-400' },
  { name: 'Green', hex: '#4CAF50', bg: 'bg-green-300', hover: 'hover:bg-green-400' },
  { name: 'Blue', hex: '#2196F3', bg: 'bg-blue-300', hover: 'hover:bg-blue-400' },
  { name: 'Pink', hex: '#E91E63', bg: 'bg-pink-300', hover: 'hover:bg-pink-400' },
  { name: 'Orange', hex: '#FF9800', bg: 'bg-orange-300', hover: 'hover:bg-orange-400' },
] as const;

export type HighlightColor = typeof HIGHLIGHT_COLORS[number];

