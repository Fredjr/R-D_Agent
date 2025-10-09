/**
 * Safe rendering utility to handle objects in JSX and prevent React error #31
 * 
 * This utility safely converts any content type to a string that can be rendered in React components
 * without causing "Objects are not valid as a React child" errors.
 */

export const safeRenderContent = (content: any): string => {
  if (content === null || content === undefined) {
    return '';
  }
  
  if (typeof content === 'string') {
    return content;
  }
  
  if (typeof content === 'number' || typeof content === 'boolean') {
    return String(content);
  }
  
  if (Array.isArray(content)) {
    return content.length > 0 ? content.join(', ') : '';
  }
  
  if (typeof content === 'object') {
    // Handle specific known structures
    if (content.research_focus) return content.research_focus;
    if (content.objective) return content.objective;
    if (content.summary) return content.summary;
    if (content.text) return content.text;
    if (content.content) return safeRenderContent(content.content);
    if (content.description) return content.description;
    if (content.title) return content.title;
    if (content.value) return safeRenderContent(content.value);
    
    // For complex objects, create a readable summary
    const keys = Object.keys(content);
    if (keys.length === 0) return '';
    
    // Try to create a meaningful summary for common report structures
    const summaryParts = [];
    
    // Research-related fields
    if (content.research_focus) summaryParts.push(`Research Focus: ${content.research_focus}`);
    if (content.objective) summaryParts.push(`Objective: ${content.objective}`);
    if (content.domains_covered) {
      const domains = Array.isArray(content.domains_covered) 
        ? content.domains_covered.join(', ') 
        : content.domains_covered;
      summaryParts.push(`Domains: ${domains}`);
    }
    if (content.total_papers_analyzed) summaryParts.push(`Papers Analyzed: ${content.total_papers_analyzed}`);
    
    // Analysis-related fields
    if (content.methodology) summaryParts.push(`Methodology: ${content.methodology}`);
    if (content.findings) summaryParts.push(`Findings: ${content.findings}`);
    if (content.conclusions) summaryParts.push(`Conclusions: ${content.conclusions}`);
    if (content.recommendations) summaryParts.push(`Recommendations: ${content.recommendations}`);
    
    // Quality and metrics
    if (content.quality_score) summaryParts.push(`Quality Score: ${content.quality_score}`);
    if (content.confidence_score) summaryParts.push(`Confidence: ${content.confidence_score}`);
    
    // If we found meaningful content, return it
    if (summaryParts.length > 0) {
      return summaryParts.join('\n\n');
    }
    
    // Try to extract any string values from the object
    const stringValues = [];
    for (const [key, value] of Object.entries(content)) {
      if (typeof value === 'string' && value.trim().length > 0) {
        stringValues.push(`${key}: ${value}`);
      } else if (typeof value === 'number') {
        stringValues.push(`${key}: ${value}`);
      }
    }
    
    if (stringValues.length > 0) {
      return stringValues.join('\n');
    }
    
    // Fallback to JSON string for debugging (formatted)
    try {
      return JSON.stringify(content, null, 2);
    } catch {
      return '[Complex Object - Unable to Display]';
    }
  }
  
  return String(content);
};

/**
 * Safe render for arrays of content
 */
export const safeRenderArray = (items: any[], separator: string = ', '): string => {
  if (!Array.isArray(items) || items.length === 0) {
    return '';
  }
  
  return items
    .map(item => safeRenderContent(item))
    .filter(content => content.length > 0)
    .join(separator);
};

/**
 * Safe render for nested object properties
 */
export const safeRenderNested = (obj: any, path: string): string => {
  if (!obj || typeof obj !== 'object') {
    return '';
  }
  
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return '';
    }
  }
  
  return safeRenderContent(current);
};

/**
 * Check if content is safe to render directly (primitive types)
 */
export const isSafeToRender = (content: any): boolean => {
  return (
    content === null ||
    content === undefined ||
    typeof content === 'string' ||
    typeof content === 'number' ||
    typeof content === 'boolean'
  );
};

/**
 * Safe render with fallback message
 */
export const safeRenderWithFallback = (content: any, fallback: string = 'No content available'): string => {
  const rendered = safeRenderContent(content);
  return rendered.length > 0 ? rendered : fallback;
};
