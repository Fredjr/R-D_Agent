import { NextRequest, NextResponse } from 'next/server';
import { enhancedOADetection } from '@/lib/enhanced-oa-detection';

const BACKEND_URL = process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app';

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 [Enhanced Deep Dive V2] Starting enhanced deep dive analysis...');
    
    const body = await request.json();
    const { pmid, title, objective, doi, projectId } = body;

    if (!pmid && !title) {
      return NextResponse.json({
        error: 'Either PMID or title is required',
        suggestion: 'Provide a PMID for better analysis'
      }, { status: 400 });
    }

    console.log(`🔍 [Enhanced Deep Dive V2] Processing: PMID=${pmid}, Title=${title?.substring(0, 50)}...`);

    // Step 1: Enhanced Open Access Detection
    console.log('🔍 [Enhanced Deep Dive V2] Step 1: Enhanced OA Detection...');
    const oaInfo = await enhancedOADetection.detectOpenAccess(pmid, doi);
    
    console.log(`📊 [Enhanced Deep Dive V2] OA Detection Result:`, {
      is_open_access: oaInfo.is_open_access,
      source: oaInfo.source,
      confidence: oaInfo.confidence,
      access_type: oaInfo.access_type,
      has_full_text_url: !!oaInfo.full_text_url,
      has_pdf_url: !!oaInfo.pdf_url
    });

    // Step 2: Enhanced Content Extraction
    console.log('🔍 [Enhanced Deep Dive V2] Step 2: Enhanced Content Extraction...');
    const contentResult = await enhancedOADetection.extractContent(oaInfo);
    
    console.log(`📄 [Enhanced Deep Dive V2] Content Extraction Result:`, {
      success: contentResult.success,
      source: contentResult.source,
      quality_score: contentResult.quality_score,
      extraction_method: contentResult.extraction_method,
      char_count: contentResult.char_count
    });

    // Step 3: Prepare Enhanced Payload for Backend
    const enhancedPayload = {
      pmid: pmid || null,
      title: title || contentResult.title || `Analysis for PMID ${pmid}`,
      objective: objective || `Enhanced deep dive analysis of: ${title || `PMID ${pmid}`}`,
      
      // Enhanced content fields
      url: oaInfo.full_text_url || oaInfo.pdf_url,
      full_text_url: oaInfo.full_text_url,
      pdf_url: oaInfo.pdf_url,
      pmc_id: oaInfo.pmc_id,
      doi: oaInfo.doi || doi,
      
      // Content extraction results
      extracted_content: contentResult.content,
      content_source: contentResult.source,
      extraction_method: contentResult.extraction_method,
      content_quality_score: contentResult.quality_score,
      
      // Analysis configuration
      analysis_mode: contentResult.success && contentResult.char_count > 2000 ? 'full_text' : 'enhanced_abstract',
      require_full_text: false,
      fallback_to_abstract: true,
      
      // Enhanced analysis flags
      include_methodology: true,
      include_results: true,
      include_implications: true,
      include_statistical_analysis: true,
      include_quality_assessment: true,
      
      // Open Access metadata
      oa_info: {
        is_open_access: oaInfo.is_open_access,
        access_type: oaInfo.access_type,
        source: oaInfo.source,
        confidence: oaInfo.confidence
      },
      
      // Project context
      projectId: projectId || null,
      
      // Enhanced processing flags
      enhanced_extraction: true,
      version: 'v2'
    };

    console.log('📤 [Enhanced Deep Dive V2] Step 3: Sending enhanced payload to backend...');
    console.log(`📊 [Enhanced Deep Dive V2] Payload summary:`, {
      has_url: !!enhancedPayload.url,
      has_extracted_content: !!enhancedPayload.extracted_content,
      content_length: enhancedPayload.extracted_content?.length || 0,
      analysis_mode: enhancedPayload.analysis_mode,
      oa_status: enhancedPayload.oa_info.is_open_access
    });

    // Step 4: Call Backend with Enhanced Payload
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    // Add User-ID header if available
    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers['User-ID'] = userIdHeader;
    }

    const response = await fetch(`${BACKEND_URL}/deep-dive`, {
      method: 'POST',
      headers,
      body: JSON.stringify(enhancedPayload),
    });

    console.log(`📡 [Enhanced Deep Dive V2] Backend response status: ${response.status}`);

    if (response.ok) {
      const result = await response.json();
      
      // Analyze result quality
      const hasModel = !!result.model_description_structured;
      const hasMethods = !!result.methods_structured;
      const hasResults = !!result.results_structured;
      const hasContent = hasModel || hasMethods || hasResults;

      console.log(`✅ [Enhanced Deep Dive V2] Analysis completed successfully:`, {
        has_model: hasModel,
        has_methods: hasMethods,
        has_results: hasResults,
        overall_success: hasContent
      });

      // Add enhanced metadata to response
      const enhancedResult = {
        ...result,
        
        // Enhanced metadata
        enhanced_analysis: true,
        version: 'v2',
        
        // Open Access information
        oa_detection: {
          is_open_access: oaInfo.is_open_access,
          access_type: oaInfo.access_type,
          source: oaInfo.source,
          confidence: oaInfo.confidence,
          full_text_url: oaInfo.full_text_url,
          pdf_url: oaInfo.pdf_url
        },
        
        // Content extraction information
        content_extraction: {
          success: contentResult.success,
          source: contentResult.source,
          quality_score: contentResult.quality_score,
          extraction_method: contentResult.extraction_method,
          char_count: contentResult.char_count
        },
        
        // Analysis quality metrics
        analysis_quality: {
          has_model_analysis: hasModel,
          has_methods_analysis: hasMethods,
          has_results_analysis: hasResults,
          overall_completeness: hasContent ? (Number(hasModel) + Number(hasMethods) + Number(hasResults)) / 3 : 0,
          content_richness: contentResult.quality_score
        }
      };

      return NextResponse.json(enhancedResult);
    }

    // Handle backend errors
    const errorResult = await response.json().catch(() => ({ error: 'Unknown backend error' }));
    console.error(`❌ [Enhanced Deep Dive V2] Backend error:`, errorResult);

    // Step 5: Intelligent Fallback Strategy
    if (errorResult.error?.includes('Unable to fetch or parse article content') || !response.ok) {
      console.log('🔄 [Enhanced Deep Dive V2] Step 5: Attempting intelligent fallback...');
      
      // Try abstract-only analysis with enhanced metadata
      const fallbackPayload = {
        ...enhancedPayload,
        analysis_mode: 'abstract_only',
        content_source: 'pubmed_abstract',
        require_full_text: false,
        fallback_analysis: true,
        
        // Use extracted abstract if available
        abstract: contentResult.abstract || contentResult.content?.substring(0, 2000),
        
        // Reduce expectations for abstract-only analysis
        include_methodology: false,
        include_results: false,
        include_statistical_analysis: false
      };

      console.log('📤 [Enhanced Deep Dive V2] Sending fallback payload...');

      const fallbackResponse = await fetch(`${BACKEND_URL}/deep-dive`, {
        method: 'POST',
        headers,
        body: JSON.stringify(fallbackPayload),
      });

      if (fallbackResponse.ok) {
        const fallbackResult = await fallbackResponse.json();
        console.log('✅ [Enhanced Deep Dive V2] Fallback analysis successful');
        
        return NextResponse.json({
          ...fallbackResult,
          enhanced_analysis: true,
          version: 'v2',
          analysis_mode: 'abstract_only_fallback',
          note: 'Analysis performed using abstract only due to content access limitations',
          oa_detection: {
            is_open_access: oaInfo.is_open_access,
            access_type: oaInfo.access_type,
            source: oaInfo.source,
            confidence: oaInfo.confidence
          },
          content_extraction: {
            success: contentResult.success,
            source: contentResult.source,
            quality_score: contentResult.quality_score,
            extraction_method: contentResult.extraction_method,
            char_count: contentResult.char_count
          }
        });
      }
    }

    // Final error response
    return NextResponse.json({
      error: errorResult.error || 'Enhanced deep dive analysis failed',
      suggestion: 'The enhanced analysis system attempted multiple extraction methods but could not access sufficient content. Try uploading a PDF or providing a direct full-text URL.',
      details: {
        backend_error: errorResult,
        oa_detection: {
          is_open_access: oaInfo.is_open_access,
          access_type: oaInfo.access_type,
          source: oaInfo.source,
          confidence: oaInfo.confidence
        },
        content_extraction: {
          success: contentResult.success,
          source: contentResult.source,
          quality_score: contentResult.quality_score,
          extraction_method: contentResult.extraction_method,
          char_count: contentResult.char_count,
          error: contentResult.error
        }
      },
      enhanced_analysis: true,
      version: 'v2'
    }, { status: response.status });

  } catch (error) {
    console.error('🔍 [Enhanced Deep Dive V2] Critical error:', error);
    return NextResponse.json({
      error: 'Enhanced deep dive analysis system error',
      details: error instanceof Error ? error.message : 'Unknown error',
      enhanced_analysis: true,
      version: 'v2'
    }, { status: 500 });
  }
}
