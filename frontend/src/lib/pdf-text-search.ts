/**
 * Phase 2: PDF Text Search Utility
 * 
 * Searches for text in PDF and returns coordinates for highlighting.
 * Used for auto-highlighting AI evidence in PDF viewer.
 */

export interface TextMatch {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

/**
 * Find text in PDF document and return coordinates
 * 
 * @param pdfDocument - PDF.js document object
 * @param searchText - Text to search for
 * @param maxPages - Maximum number of pages to search (default: all)
 * @returns Array of text matches with coordinates
 */
export async function findTextInPDF(
  pdfDocument: any,
  searchText: string,
  maxPages?: number
): Promise<TextMatch[]> {
  if (!pdfDocument || !searchText || searchText.length < 10) {
    return [];
  }

  const matches: TextMatch[] = [];
  const numPages = maxPages || pdfDocument.numPages;
  const normalizedSearch = normalizeText(searchText);

  console.log(`🔍 Searching for text in PDF (${numPages} pages): "${searchText.substring(0, 50)}..."`);

  try {
    // Search each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdfDocument.getPage(pageNum);
      const textContent = await page.getTextContent();
      const viewport = page.getViewport({ scale: 1.0 });

      // Find matches on this page
      const pageMatches = findTextInTextContent(
        textContent,
        normalizedSearch,
        viewport,
        pageNum
      );

      matches.push(...pageMatches);

      // Stop if we found matches (evidence is usually on first few pages)
      if (matches.length > 0 && pageNum >= 3) {
        break;
      }
    }

    console.log(`✅ Found ${matches.length} matches`);
    return matches;

  } catch (error) {
    console.error('❌ Error searching PDF:', error);
    return [];
  }
}

/**
 * Find text in a page's text content
 */
function findTextInTextContent(
  textContent: any,
  searchText: string,
  viewport: any,
  pageNum: number
): TextMatch[] {
  const matches: TextMatch[] = [];
  const items = textContent.items;

  // Build full page text with item indices
  let fullText = '';
  const itemMap: Array<{ start: number; end: number; item: any }> = [];

  items.forEach((item: any) => {
    const start = fullText.length;
    const text = item.str;
    fullText += text + ' ';
    const end = fullText.length;
    itemMap.push({ start, end, item });
  });

  const normalizedFullText = normalizeText(fullText);

  // Find all occurrences of search text
  let index = normalizedFullText.indexOf(searchText);
  
  while (index !== -1) {
    // Find which text items contain this match
    const matchEnd = index + searchText.length;
    const matchingItems = itemMap.filter(
      (m) => (m.start <= index && m.end > index) || (m.start < matchEnd && m.end >= matchEnd)
    );

    if (matchingItems.length > 0) {
      // Calculate bounding box for all matching items
      const bbox = calculateBoundingBox(matchingItems.map((m) => m.item), viewport);
      
      if (bbox) {
        matches.push({
          page: pageNum,
          x: bbox.x,
          y: bbox.y,
          width: bbox.width,
          height: bbox.height,
          text: fullText.substring(index, matchEnd).trim(),
        });
      }
    }

    // Find next occurrence
    index = normalizedFullText.indexOf(searchText, index + 1);
  }

  return matches;
}

/**
 * Calculate bounding box for multiple text items
 */
function calculateBoundingBox(items: any[], viewport: any): { x: number; y: number; width: number; height: number } | null {
  if (items.length === 0) return null;

  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  items.forEach((item) => {
    const transform = item.transform;
    const x = transform[4];
    const y = transform[5];
    const width = item.width;
    const height = item.height;

    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x + width);
    maxY = Math.max(maxY, y + height);
  });

  // Convert PDF coordinates to viewport coordinates
  const [x1, y1] = viewport.convertToViewportPoint(minX, minY);
  const [x2, y2] = viewport.convertToViewportPoint(maxX, maxY);

  return {
    x: Math.min(x1, x2),
    y: Math.min(y1, y2),
    width: Math.abs(x2 - x1),
    height: Math.abs(y2 - y1),
  };
}

/**
 * Normalize text for comparison (remove extra whitespace, lowercase)
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Find partial matches (for fuzzy matching)
 */
export async function findPartialTextInPDF(
  pdfDocument: any,
  searchText: string,
  minMatchLength: number = 30
): Promise<TextMatch[]> {
  // Split search text into chunks
  const words = searchText.split(/\s+/);
  const chunks: string[] = [];

  for (let i = 0; i < words.length - 2; i++) {
    const chunk = words.slice(i, i + 5).join(' ');
    if (chunk.length >= minMatchLength) {
      chunks.push(chunk);
    }
  }

  // Search for each chunk
  const allMatches: TextMatch[] = [];
  for (const chunk of chunks) {
    const matches = await findTextInPDF(pdfDocument, chunk, 5); // Search first 5 pages only
    allMatches.push(...matches);
  }

  // Deduplicate matches
  return deduplicateMatches(allMatches);
}

/**
 * Remove duplicate/overlapping matches
 */
function deduplicateMatches(matches: TextMatch[]): TextMatch[] {
  const unique: TextMatch[] = [];

  matches.forEach((match) => {
    const isDuplicate = unique.some(
      (u) =>
        u.page === match.page &&
        Math.abs(u.x - match.x) < 10 &&
        Math.abs(u.y - match.y) < 10
    );

    if (!isDuplicate) {
      unique.push(match);
    }
  });

  return unique;
}

