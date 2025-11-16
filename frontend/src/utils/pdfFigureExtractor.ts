import { pdfjs } from 'react-pdf';

export interface ExtractedFigure {
  id: string;
  title: string;
  caption: string;
  pageNumber: number;
  imageUrl?: string;
  type: 'figure' | 'chart' | 'table';
  imageData?: string; // Base64 encoded image
}

/**
 * Extract figures, charts, and tables from a PDF document
 * This function analyzes the PDF content to find images and their captions
 * AND renders the actual images
 */
export async function extractFiguresFromPDF(
  pdfUrl: string,
  pdfDocument?: any
): Promise<ExtractedFigure[]> {
  try {
    let pdf = pdfDocument;

    // Load PDF if not provided
    if (!pdf) {
      const loadingTask = pdfjs.getDocument(pdfUrl);
      pdf = await loadingTask.promise;
    }

    const figures: ExtractedFigure[] = [];
    const numPages = pdf.numPages;

    console.log(`🔍 [FigureExtractor] Extracting figures from ${numPages} pages...`);

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);

      // Get text content to find captions
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      // Look for "Figure", "Abb." (German), "Tab." (Table) keywords in text
      const figureMatches = pageText.match(/(Figure|Fig\.|Abb\.)\s+\d+[:.]/gi) || [];
      const tableMatches = pageText.match(/(Table|Tab\.)\s+\d+[:.]/gi) || [];

      console.log(`📄 [FigureExtractor] Page ${pageNum}: Found ${figureMatches.length} figures, ${tableMatches.length} tables`);

      // Extract figures with actual image data
      for (let idx = 0; idx < figureMatches.length; idx++) {
        const match = figureMatches[idx];
        const captionStart = pageText.indexOf(match);
        const caption = pageText.substring(captionStart, Math.min(captionStart + 300, pageText.length));

        // Render the page as an image
        const imageData = await extractImageFromPage(pdf, pageNum);

        figures.push({
          id: `fig-${pageNum}-${idx}`,
          title: match.replace(/[:.]/g, '').trim(),
          caption: caption.trim(),
          pageNumber: pageNum,
          type: 'figure',
          imageData: imageData || undefined,
        });
      }

      // Extract tables with actual image data
      for (let idx = 0; idx < tableMatches.length; idx++) {
        const match = tableMatches[idx];
        const captionStart = pageText.indexOf(match);
        const caption = pageText.substring(captionStart, Math.min(captionStart + 300, pageText.length));

        // Render the page as an image
        const imageData = await extractImageFromPage(pdf, pageNum);

        figures.push({
          id: `table-${pageNum}-${idx}`,
          title: match.replace(/[:.]/g, '').trim(),
          caption: caption.trim(),
          pageNumber: pageNum,
          type: 'table',
          imageData: imageData || undefined,
        });
      }
    }

    console.log(`✅ [FigureExtractor] Extracted ${figures.length} figures from PDF`);
    return figures;
  } catch (error) {
    console.error('❌ [FigureExtractor] Error extracting figures from PDF:', error);
    return [];
  }
}

/**
 * Extract caption text from page text based on common patterns
 */
function extractCaptionFromText(pageText: string, imageIndex: number): string {
  // Look for common caption patterns
  const patterns = [
    /Figure\s+\d+[:.]\s*([^.]+\.)/i,
    /Fig\.\s*\d+[:.]\s*([^.]+\.)/i,
    /Table\s+\d+[:.]\s*([^.]+\.)/i,
  ];

  for (const pattern of patterns) {
    const match = pageText.match(pattern);
    if (match && match[1]) {
      return match[0].trim();
    }
  }

  return '';
}

/**
 * Determine figure type based on caption text
 */
function determineFigureType(caption: string): 'figure' | 'chart' | 'table' {
  const lowerCaption = caption.toLowerCase();
  
  if (lowerCaption.includes('table')) {
    return 'table';
  }
  
  if (lowerCaption.includes('chart') || 
      lowerCaption.includes('graph') || 
      lowerCaption.includes('plot')) {
    return 'chart';
  }
  
  return 'figure';
}

/**
 * Extract image data from a specific page
 * This is a more complex operation that requires canvas rendering
 */
export async function extractImageFromPage(
  pdfDocument: any,
  pageNumber: number,
  imageIndex: number = 0
): Promise<string | null> {
  try {
    const page = await pdfDocument.getPage(pageNumber);
    const viewport = page.getViewport({ scale: 2.0 });
    
    // Create canvas
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    
    if (!context) {
      return null;
    }
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    // Render page to canvas
    await page.render({
      canvasContext: context,
      viewport: viewport,
    }).promise;
    
    // Convert canvas to base64 image
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error extracting image from page:', error);
    return null;
  }
}

