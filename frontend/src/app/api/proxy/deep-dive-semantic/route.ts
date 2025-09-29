import { NextRequest, NextResponse } from 'next/server';
import { SemanticDeepDiveEngine, SemanticDeepDiveRequest } from '@/lib/semantic-deep-dive';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log('🔬 [SEMANTIC-DEEP-DIVE] 🚀 Starting semantic-enhanced deep dive analysis...');

    const body = await request.json();
    const userId = request.headers.get('User-ID') || body.userId || 'default_user';

    console.log('🔬 [SEMANTIC-DEEP-DIVE] 📝 Request details:', {
      pmid: body.pmid,
      title: body.title?.substring(0, 50) + (body.title?.length > 50 ? '...' : ''),
      userId: userId,
      semantic_context: body.semantic_context,
      find_related_papers: body.find_related_papers,
      cross_domain_analysis: body.cross_domain_analysis,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      bodyKeys: Object.keys(body)
    });

    console.log('🔬 [SEMANTIC-DEEP-DIVE] 🔧 Initializing semantic deep-dive engine...');
    
    // Validate required fields
    if (!body.pmid && !body.title && !body.url) {
      return NextResponse.json({
        error: 'Either PMID, title, or URL is required for deep dive analysis',
        suggestion: 'Provide a PMID for best results, or a paper title/URL'
      }, { status: 400 });
    }

    // Construct semantic deep dive request
    const semanticRequest: SemanticDeepDiveRequest = {
      // Traditional fields
      url: body.url,
      pmid: body.pmid,
      title: body.title,
      objective: body.objective || `Deep dive analysis of: ${body.title || body.pmid}`,
      projectId: body.projectId,
      
      // Semantic enhancement fields
      semantic_context: body.semantic_context !== false, // Default to true
      user_research_domains: body.user_research_domains || [],
      find_related_papers: body.find_related_papers !== false, // Default to true
      concept_mapping: body.concept_mapping !== false, // Default to true
      cross_domain_analysis: body.cross_domain_analysis || false,
      similarity_threshold: body.similarity_threshold || 0.4,
      max_related_papers: body.max_related_papers || 15,
      
      // User context
      user_context: body.user_context || {
        research_interests: [],
        recent_papers: [],
        saved_collections: [],
        search_history: []
      }
    };

    console.log('🔬 [Semantic Deep Dive] Request constructed:', {
      pmid: semanticRequest.pmid,
      title: semanticRequest.title?.substring(0, 50) + '...',
      semantic_context: semanticRequest.semantic_context,
      find_related_papers: semanticRequest.find_related_papers,
      user_id: userId
    });

    // Initialize semantic engine
    console.log('🔬 [SEMANTIC-DEEP-DIVE] 🔧 Creating SemanticDeepDiveEngine instance...');
    const semanticEngine = new SemanticDeepDiveEngine();
    console.log('🔬 [SEMANTIC-DEEP-DIVE] ✅ SemanticDeepDiveEngine created successfully');

    // Perform semantic-enhanced deep dive
    console.log('🔬 [SEMANTIC-DEEP-DIVE] 🚀 Executing performSemanticDeepDive...');
    console.log('🔬 [SEMANTIC-DEEP-DIVE] 📋 Semantic request payload:', {
      ...semanticRequest,
      title: semanticRequest.title?.substring(0, 100) + '...'
    });

    const semanticResponse = await semanticEngine.performSemanticDeepDive(
      semanticRequest,
      userId
    );

    console.log('🔬 [SEMANTIC-DEEP-DIVE] ✅ performSemanticDeepDive completed successfully');
    console.log('🔬 [SEMANTIC-DEEP-DIVE] 📊 Response structure:', {
      hasModelDescription: !!semanticResponse?.model_description_structured,
      hasMethods: !!semanticResponse?.methods_structured,
      hasResults: !!semanticResponse?.results_structured,
      hasSemanticAnalysis: !!semanticResponse?.semantic_analysis,
      hasRelatedPapers: !!semanticResponse?.related_papers,
      responseKeys: Object.keys(semanticResponse || {})
    });

    console.log('🔬 [Semantic Deep Dive] Success:', {
      has_model: !!semanticResponse.model_description_structured,
      has_methods: !!semanticResponse.methods_structured,
      has_results: !!semanticResponse.results_structured,
      paper_concepts: semanticResponse.semantic_analysis?.paper_concepts?.length || 0,
      related_papers_categories: Object.keys(semanticResponse.related_papers || {}).length,
      user_relevance: semanticResponse.user_insights?.relevance_to_user || 'N/A',
      recommendations: semanticResponse.recommendations?.next_papers_to_read?.length || 0
    });

    // Add metadata for UI
    const enhancedResponse = {
      ...semanticResponse,
      metadata: {
        analysis_type: 'semantic_enhanced',
        timestamp: new Date().toISOString(),
        user_id: userId,
        semantic_features: {
          context_analysis: semanticRequest.semantic_context,
          related_papers: semanticRequest.find_related_papers,
          concept_mapping: semanticRequest.concept_mapping,
          cross_domain: semanticRequest.cross_domain_analysis,
          personalization: !!semanticRequest.user_context
        }
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('🔬 [Semantic Deep Dive] Error:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({
          error: 'Deep dive analysis timed out',
          suggestion: 'The analysis is taking longer than expected. Try again or use a different paper.',
          details: error.message
        }, { status: 504 });
      }
      
      if (error.message.includes('not found')) {
        return NextResponse.json({
          error: 'Paper not found',
          suggestion: 'Check the PMID or try providing the paper title instead',
          details: error.message
        }, { status: 404 });
      }
      
      if (error.message.includes('access')) {
        return NextResponse.json({
          error: 'Unable to access paper content',
          suggestion: 'This paper may be behind a paywall. Try uploading a PDF or finding an open access version.',
          details: error.message
        }, { status: 403 });
      }
    }

    return NextResponse.json({
      error: 'Failed to perform semantic-enhanced deep dive',
      suggestion: 'Try again with a different paper or check if the PMID is correct',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
