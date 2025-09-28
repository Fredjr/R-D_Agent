/**
 * Enhanced Open Access Detection System
 * Improved detection and content extraction for better deep dive analysis
 */

export interface OpenAccessInfo {
  pmid: string;
  is_open_access: boolean;
  full_text_url?: string;
  pdf_url?: string;
  pmc_id?: string;
  doi?: string;
  source: 'unpaywall' | 'pmc' | 'pubmed' | 'crossref' | 'manual';
  confidence: number;
  access_type: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
}

export interface ContentExtractionResult {
  success: boolean;
  content?: string;
  title?: string;
  abstract?: string;
  full_text?: string;
  source: string;
  quality_score: number;
  extraction_method: string;
  char_count: number;
  error?: string;
}

export class EnhancedOADetection {
  private cache: Map<string, OpenAccessInfo> = new Map();
  private readonly UNPAYWALL_EMAIL = 'fredericle77@gmail.com';

  /**
   * Comprehensive Open Access detection using multiple sources
   */
  async detectOpenAccess(pmid: string, doi?: string): Promise<OpenAccessInfo> {
    // Check cache first
    const cached = this.cache.get(pmid);
    if (cached) return cached;

    console.log(`🔍 [Enhanced OA] Detecting Open Access for PMID: ${pmid}`);

    // Try multiple detection methods in order of reliability
    const detectionMethods = [
      () => this.detectViaUnpaywall(doi || pmid),
      () => this.detectViaPMC(pmid),
      () => this.detectViaPubMed(pmid),
      () => this.detectViaCrossRef(doi || pmid),
      () => this.detectViaManualPatterns(pmid)
    ];

    for (const method of detectionMethods) {
      try {
        const result = await method();
        if (result.is_open_access) {
          this.cache.set(pmid, result);
          console.log(`✅ [Enhanced OA] Found Open Access via ${result.source}: ${result.full_text_url || result.pdf_url}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ [Enhanced OA] Detection method failed:`, error);
      }
    }

    // Return closed access result
    const closedResult: OpenAccessInfo = {
      pmid,
      is_open_access: false,
      source: 'manual',
      confidence: 0.9,
      access_type: 'closed'
    };

    this.cache.set(pmid, closedResult);
    return closedResult;
  }

  /**
   * Enhanced content extraction with multiple strategies
   */
  async extractContent(oaInfo: OpenAccessInfo): Promise<ContentExtractionResult> {
    if (!oaInfo.is_open_access) {
      return {
        success: false,
        source: 'none',
        quality_score: 0,
        extraction_method: 'none',
        char_count: 0,
        error: 'Paper is not Open Access'
      };
    }

    console.log(`📄 [Enhanced OA] Extracting content from ${oaInfo.source}`);

    // Try extraction methods based on available URLs
    const extractionMethods = [];

    if (oaInfo.full_text_url) {
      extractionMethods.push(() => this.extractFromFullTextUrl(oaInfo.full_text_url!));
    }

    if (oaInfo.pdf_url) {
      extractionMethods.push(() => this.extractFromPdfUrl(oaInfo.pdf_url!));
    }

    if (oaInfo.pmc_id) {
      extractionMethods.push(() => this.extractFromPMC(oaInfo.pmc_id!));
    }

    // Fallback to PubMed abstract
    extractionMethods.push(() => this.extractFromPubMed(oaInfo.pmid));

    for (const method of extractionMethods) {
      try {
        const result = await method();
        if (result.success && result.char_count > 500) {
          console.log(`✅ [Enhanced OA] Content extracted successfully: ${result.char_count} chars via ${result.extraction_method}`);
          return result;
        }
      } catch (error) {
        console.warn(`⚠️ [Enhanced OA] Extraction method failed:`, error);
      }
    }

    return {
      success: false,
      source: oaInfo.source,
      quality_score: 0,
      extraction_method: 'failed',
      char_count: 0,
      error: 'All extraction methods failed'
    };
  }

  /**
   * Detect Open Access via Unpaywall API
   */
  private async detectViaUnpaywall(identifier: string): Promise<OpenAccessInfo> {
    const url = `https://api.unpaywall.org/v2/${identifier}?email=${this.UNPAYWALL_EMAIL}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Unpaywall API failed');

    const data = await response.json();
    
    if (data.is_oa) {
      const bestLocation = data.best_oa_location || data.oa_locations?.[0];
      
      return {
        pmid: identifier,
        is_open_access: true,
        full_text_url: bestLocation?.url_for_landing_page,
        pdf_url: bestLocation?.url_for_pdf,
        doi: data.doi,
        source: 'unpaywall',
        confidence: 0.95,
        access_type: data.oa_type || 'unknown'
      };
    }

    throw new Error('Not Open Access according to Unpaywall');
  }

  /**
   * Detect Open Access via PMC
   */
  private async detectViaPMC(pmid: string): Promise<OpenAccessInfo> {
    // Check if paper is in PMC
    const pmcUrl = `https://www.ncbi.nlm.nih.gov/pmc/utils/idconv/v1.0/?ids=${pmid}&format=json`;
    
    const response = await fetch(pmcUrl);
    if (!response.ok) throw new Error('PMC ID conversion failed');

    const data = await response.json();
    const record = data.records?.[0];

    if (record?.pmcid) {
      const pmcId = record.pmcid.replace('PMC', '');
      
      return {
        pmid,
        is_open_access: true,
        full_text_url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/`,
        pdf_url: `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/`,
        pmc_id: pmcId,
        doi: record.doi,
        source: 'pmc',
        confidence: 0.9,
        access_type: 'gold'
      };
    }

    throw new Error('Not available in PMC');
  }

  /**
   * Detect Open Access via PubMed
   */
  private async detectViaPubMed(pmid: string): Promise<OpenAccessInfo> {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('PubMed fetch failed');

    const xmlText = await response.text();
    
    // Check for free full text indicators
    const hasFreeFullText = xmlText.includes('free full text') || 
                           xmlText.includes('PMC') ||
                           xmlText.includes('free article');

    if (hasFreeFullText) {
      // Extract PMC ID if available
      const pmcMatch = xmlText.match(/PMC(\d+)/);
      const pmcId = pmcMatch?.[1];

      return {
        pmid,
        is_open_access: true,
        full_text_url: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/` : undefined,
        pdf_url: pmcId ? `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmcId}/pdf/` : undefined,
        pmc_id: pmcId,
        source: 'pubmed',
        confidence: 0.8,
        access_type: 'green'
      };
    }

    throw new Error('No free full text indicators in PubMed');
  }

  /**
   * Detect Open Access via CrossRef
   */
  private async detectViaCrossRef(identifier: string): Promise<OpenAccessInfo> {
    const url = `https://api.crossref.org/works/${identifier}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('CrossRef API failed');

    const data = await response.json();
    const work = data.message;

    // Check for open access indicators
    const license = work.license?.[0];
    const isOpenAccess = license?.URL?.includes('creativecommons') || 
                        work.is_referenced_by_count > 0;

    if (isOpenAccess && work.URL) {
      return {
        pmid: identifier,
        is_open_access: true,
        full_text_url: work.URL,
        doi: work.DOI,
        source: 'crossref',
        confidence: 0.7,
        access_type: 'hybrid'
      };
    }

    throw new Error('Not Open Access according to CrossRef');
  }

  /**
   * Detect Open Access via manual patterns
   */
  private async detectViaManualPatterns(pmid: string): Promise<OpenAccessInfo> {
    // Common Open Access URL patterns
    const patterns = [
      `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${pmid}/`,
      `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
      `https://www.biorxiv.org/content/10.1101/${pmid}`,
      `https://arxiv.org/abs/${pmid}`
    ];

    for (const url of patterns) {
      try {
        const response = await fetch(url, { method: 'HEAD' });
        if (response.ok) {
          return {
            pmid,
            is_open_access: true,
            full_text_url: url,
            source: 'manual',
            confidence: 0.6,
            access_type: 'green'
          };
        }
      } catch (error) {
        // Continue to next pattern
      }
    }

    throw new Error('No manual patterns matched');
  }

  /**
   * Extract content from full-text URL
   */
  private async extractFromFullTextUrl(url: string): Promise<ContentExtractionResult> {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch full-text URL');

    const html = await response.text();
    const textContent = this.extractTextFromHtml(html);

    return {
      success: true,
      content: textContent,
      full_text: textContent,
      source: 'full_text_url',
      quality_score: this.calculateQualityScore(textContent),
      extraction_method: 'html_parsing',
      char_count: textContent.length
    };
  }

  /**
   * Extract content from PDF URL
   */
  private async extractFromPdfUrl(url: string): Promise<ContentExtractionResult> {
    // For now, return the PDF URL for backend processing
    return {
      success: true,
      content: `PDF available at: ${url}`,
      source: 'pdf_url',
      quality_score: 0.7,
      extraction_method: 'pdf_reference',
      char_count: url.length
    };
  }

  /**
   * Extract content from PMC
   */
  private async extractFromPMC(pmcId: string): Promise<ContentExtractionResult> {
    const url = `https://www.ncbi.nlm.nih.gov/pmc/oai/oai.cgi?verb=GetRecord&identifier=oai:pubmedcentral.nih.gov:${pmcId}&metadataPrefix=pmc`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('PMC OAI fetch failed');

    const xmlText = await response.text();
    const textContent = this.extractTextFromXml(xmlText);

    return {
      success: true,
      content: textContent,
      full_text: textContent,
      source: 'pmc_oai',
      quality_score: this.calculateQualityScore(textContent),
      extraction_method: 'xml_parsing',
      char_count: textContent.length
    };
  }

  /**
   * Extract content from PubMed (abstract only)
   */
  private async extractFromPubMed(pmid: string): Promise<ContentExtractionResult> {
    const url = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmid}&retmode=xml`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('PubMed fetch failed');

    const xmlText = await response.text();
    
    // Extract title and abstract
    const titleMatch = xmlText.match(/<ArticleTitle>([\s\S]*?)<\/ArticleTitle>/);
    const abstractMatch = xmlText.match(/<AbstractText[^>]*>([\s\S]*?)<\/AbstractText>/);
    
    const title = titleMatch?.[1]?.replace(/<[^>]+>/g, '') || '';
    const abstract = abstractMatch?.[1]?.replace(/<[^>]+>/g, '') || '';
    
    const content = `${title}\n\n${abstract}`;

    return {
      success: true,
      content,
      title,
      abstract,
      source: 'pubmed_abstract',
      quality_score: 0.5, // Lower quality as it's abstract only
      extraction_method: 'xml_parsing',
      char_count: content.length
    };
  }

  /**
   * Extract text content from HTML
   */
  private extractTextFromHtml(html: string): string {
    // Simple HTML text extraction
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Extract text content from XML
   */
  private extractTextFromXml(xml: string): string {
    // Simple XML text extraction
    return xml
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Calculate content quality score
   */
  private calculateQualityScore(content: string): number {
    let score = 0.5; // Base score

    // Length bonus
    if (content.length > 5000) score += 0.3;
    else if (content.length > 2000) score += 0.2;
    else if (content.length > 1000) score += 0.1;

    // Scientific content indicators
    const scientificTerms = ['method', 'result', 'conclusion', 'analysis', 'study', 'research'];
    const termCount = scientificTerms.filter(term => 
      content.toLowerCase().includes(term)
    ).length;
    score += (termCount / scientificTerms.length) * 0.2;

    return Math.min(score, 1.0);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
export const enhancedOADetection = new EnhancedOADetection();
