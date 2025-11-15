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

    console.log(`🔍 Extracting figures from ${numPages} pages...`);

    // Process each page
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      
      // Get page operations to find images
      const ops = await page.getOperatorList();
      
      // Get text content to find captions
      const textContent = await page.getTextContent();
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ');

      // Find images in the page
      let imageCount = 0;
      for (let i = 0; i < ops.fnArray.length; i++) {
        // Check for image operations (paintImageXObject, paintInlineImageXObject)
        if (ops.fnArray[i] === pdfjs.OPS.paintImageXObject || 
            ops.fnArray[i] === pdfjs.OPS.paintInlineImageXObject) {
          imageCount++;
          
          // Try to extract caption from nearby text
          const caption = extractCaptionFromText(pageText, imageCount);
          const figureType = determineFigureType(caption);
          
          figures.push({
            id: `fig-${pageNum}-${imageCount}`,
            title: `${figureType === 'table' ? 'Table' : 'Figure'} ${figures.length + 1}`,
            caption: caption || 'No caption available',
            pageNumber: pageNum,
            type: figureType,
            // Note: Extracting actual image data requires more complex processing
            // For now, we'll just mark that an image exists
          });
        }
      }

      // Also look for "Figure" or "Table" keywords in text as fallback
      const figureMatches = pageText.match(/Figure\s+\d+[:.]/gi) || [];
      const tableMatches = pageText.match(/Table\s+\d+[:.]/gi) || [];
      
      // Add figures found by text analysis if not already added
      figureMatches.forEach((match: string, idx: number) => {
        if (imageCount === 0 || idx >= imageCount) {
          const captionStart = pageText.indexOf(match);
          const caption = pageText.substring(captionStart, captionStart + 200);

          figures.push({
            id: `fig-text-${pageNum}-${idx}`,
            title: match.replace(/[:.]/g, '').trim(),
            caption: caption.trim(),
            pageNumber: pageNum,
            type: 'figure',
          });
        }
      });

      tableMatches.forEach((match: string, idx: number) => {
        const captionStart = pageText.indexOf(match);
        const caption = pageText.substring(captionStart, captionStart + 200);

        figures.push({
          id: `table-text-${pageNum}-${idx}`,
          title: match.replace(/[:.]/g, '').trim(),
          caption: caption.trim(),
          pageNumber: pageNum,
          type: 'table',
        });
      });
    }

    console.log(`✅ Extracted ${figures.length} figures from PDF`);
    return figures;
  } catch (error) {
    console.error('Error extracting figures from PDF:', error);
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

