import { NextRequest, NextResponse } from 'next/server';
import { SemanticGenerateReviewEngine, SemanticReviewRequest } from '@/lib/semantic-generate-review';

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    console.log('🧠 [SEMANTIC-GEN-REVIEW] 🚀 Starting semantic-enhanced review generation...');

    const body = await request.json();
    const userId = request.headers.get('User-ID') || body.userId || 'default_user';

    console.log('🧠 [SEMANTIC-GEN-REVIEW] 📝 Request details:', {
      molecule: body.molecule?.substring(0, 50) + (body.molecule?.length > 50 ? '...' : ''),
      userId: userId,
      semantic_expansion: body.semantic_expansion,
      domain_focus: body.domain_focus,
      cross_domain_exploration: body.cross_domain_exploration,
      fullTextOnly: body.fullTextOnly,
      requestHeaders: Object.fromEntries(request.headers.entries()),
      bodyKeys: Object.keys(body)
    });

    console.log('🧠 [SEMANTIC-GEN-REVIEW] 🔧 Initializing semantic engine...');
    
    // Validate required fields
    if (!body.molecule) {
      return NextResponse.json({
        error: 'Molecule/topic is required for review generation',
        suggestion: 'Provide a research topic or molecule name'
      }, { status: 400 });
    }

    // Construct semantic review request
    const semanticRequest: SemanticReviewRequest = {
      // Traditional fields
      molecule: body.molecule,
      objective: body.objective || `Comprehensive review of ${body.molecule}`,
      projectId: body.projectId,
      clinicalMode: body.clinicalMode || false,
      preference: body.preference || 'precision',
      dagMode: body.dagMode || false,
      fullTextOnly: body.fullTextOnly || false,
      
      // Semantic enhancement fields
      semantic_expansion: body.semantic_expansion !== false, // Default to true
      domain_focus: body.domain_focus || [],
      cross_domain_exploration: body.cross_domain_exploration || false,
      similarity_threshold: body.similarity_threshold || 0.3,
      include_related_concepts: body.include_related_concepts !== false, // Default to true
      max_semantic_results: body.max_semantic_results || 30,
      
      // User context
      user_context: body.user_context || {
        research_domains: [],
        recent_searches: [],
        saved_papers: [],
        interaction_history: []
      }
    };

    console.log('🧠 [Semantic Generate Review] Request constructed:', {
      molecule: semanticRequest.molecule,
      semantic_expansion: semanticRequest.semantic_expansion,
      domain_focus: semanticRequest.domain_focus,
      user_id: userId
    });

    // Initialize semantic engine
    console.log('🧠 [SEMANTIC-GEN-REVIEW] 🔧 Creating SemanticGenerateReviewEngine instance...');
    const semanticEngine = new SemanticGenerateReviewEngine();
    console.log('🧠 [SEMANTIC-GEN-REVIEW] ✅ SemanticGenerateReviewEngine created successfully');

    // Generate semantic-enhanced review
    console.log('🧠 [SEMANTIC-GEN-REVIEW] 🚀 Executing generateSemanticReview...');
    console.log('🧠 [SEMANTIC-GEN-REVIEW] 📋 Semantic request payload:', {
      ...semanticRequest,
      molecule: semanticRequest.molecule?.substring(0, 100) + '...'
    });

    const semanticResponse = await semanticEngine.generateSemanticReview(
      semanticRequest,
      userId
    );

    console.log('🧠 [SEMANTIC-GEN-REVIEW] ✅ generateSemanticReview completed successfully');
    console.log('🧠 [SEMANTIC-GEN-REVIEW] 📊 Response structure:', {
      hasResults: !!semanticResponse?.results,
      hasSemanticAnalysis: !!semanticResponse?.semantic_analysis,
      hasPersonalization: !!semanticResponse?.personalization,
      hasContentQuality: !!semanticResponse?.content_quality,
      resultCount: semanticResponse?.results?.length || 0,
      responseKeys: Object.keys(semanticResponse || {})
    });

    console.log('🧠 [Semantic Generate Review] Success:', {
      results_count: semanticResponse.results?.length || 0,
      semantic_queries: semanticResponse.semantic_analysis?.expanded_queries?.length || 0,
      concept_mappings: Object.keys(semanticResponse.semantic_analysis?.concept_mappings || {}).length,
      user_relevance_scores: Object.keys(semanticResponse.personalization?.relevance_scores || {}).length
    });

    // Add metadata for UI
    const enhancedResponse = {
      ...semanticResponse,
      metadata: {
        generation_type: 'semantic_enhanced',
        timestamp: new Date().toISOString(),
        user_id: userId,
        semantic_features: {
          query_expansion: semanticRequest.semantic_expansion,
          domain_focus: semanticRequest.domain_focus,
          cross_domain: semanticRequest.cross_domain_exploration,
          personalization: !!semanticRequest.user_context
        }
      }
    };

    return NextResponse.json(enhancedResponse);

  } catch (error) {
    console.error('🧠 [Semantic Generate Review] Error:', error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('timeout')) {
        return NextResponse.json({
          error: 'Review generation timed out',
          suggestion: 'Try reducing the scope or complexity of your review request',
          details: error.message
        }, { status: 504 });
      }
      
      if (error.message.includes('rate limit')) {
        return NextResponse.json({
          error: 'Rate limit exceeded',
          suggestion: 'Please wait a moment before making another request',
          details: error.message
        }, { status: 429 });
      }
    }

    return NextResponse.json({
      error: 'Failed to generate semantic-enhanced review',
      suggestion: 'Try again with a simpler query or check your network connection',
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
