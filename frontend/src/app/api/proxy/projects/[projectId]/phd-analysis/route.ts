import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

/**
 * POST /api/proxy/projects/[projectId]/phd-analysis
 * Generate PhD-specific analysis using specialized agent orchestration
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('🎓 [PhD Analysis] Starting specialized PhD analysis for project:', projectId);
    console.log('🎓 [PhD Analysis] Analysis type:', body.analysis_type);
    
    // Enhanced payload for PhD-specific orchestration
    const phdPayload = {
      project_id: projectId,
      user_id: userId,
      analysis_type: body.analysis_type || 'comprehensive_phd',
      
      // PhD-specific agent configuration
      agent_config: {
        literature_review: {
          enabled: body.include_literature_review !== false,
          semantic_clustering: true,
          theoretical_frameworks: true,
          literature_timeline: true
        },
        methodology_synthesis: {
          enabled: body.include_methodology_synthesis !== false,
          classification_model: 'scibert',
          statistical_extraction: true,
          experimental_design_analysis: true
        },
        gap_analysis: {
          enabled: body.include_gap_analysis !== false,
          semantic_gaps: true,
          methodology_gaps: true,
          temporal_gaps: true,
          cross_domain_opportunities: true
        },
        thesis_structure: {
          enabled: body.include_thesis_structure !== false,
          chapter_organization: true,
          academic_writing: true,
          citation_formatting: body.citation_style || 'apa'
        },
        citation_network: {
          enabled: body.include_citation_analysis !== false,
          author_analysis: true,
          influence_scoring: true,
          collaboration_networks: true
        }
      },
      
      // User context for personalization
      user_context: {
        academic_level: body.academic_level || 'phd',
        research_stage: body.research_stage || 'dissertation',
        research_domain: body.research_domain,
        thesis_chapter_focus: body.thesis_chapter_focus,
        advisor_requirements: body.advisor_requirements,
        defense_timeline: body.defense_timeline
      },
      
      // Output preferences
      output_preferences: {
        format: body.output_format || 'thesis_structured',
        citation_style: body.citation_style || 'apa',
        include_visualizations: body.include_visualizations !== false,
        include_recommendations: body.include_recommendations !== false,
        academic_tone: body.academic_tone || 'formal'
      }
    };
    
    // Add timeout for PhD analysis (longer than standard)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 300000); // 5 minutes
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/phd-analysis`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(phdPayload),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎓 [PhD Analysis] Backend error:', response.status, errorText);
      return NextResponse.json(
        { 
          error: `PhD analysis failed: ${errorText}`,
          status: response.status,
          timestamp: new Date().toISOString(),
          project_id: projectId
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🎓 [PhD Analysis] Analysis complete:', {
      projectId,
      analysisType: data.analysis_type,
      agentsExecuted: Object.keys(data.agent_results || {}),
      hasThesisStructure: !!data.thesis_structure,
      hasGapAnalysis: !!data.gap_analysis,
      hasMethodologySynthesis: !!data.methodology_synthesis
    });
    
    return NextResponse.json(data);
    
  } catch (error: any) {
    console.error('🎓 [PhD Analysis] Proxy error:', error);
    
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { 
          error: 'PhD analysis timeout',
          message: 'Analysis took longer than 5 minutes - please try with smaller scope',
          timestamp: new Date().toISOString()
        },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { 
        error: 'PhD analysis failed',
        message: error.message || 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proxy/projects/[projectId]/phd-analysis
 * Get existing PhD analysis results
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('🎓 [PhD Analysis] Fetching existing analysis for project:', projectId);
    
    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/phd-analysis`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { 
            message: 'No PhD analysis found for this project',
            project_id: projectId
          },
          { status: 404 }
        );
      }
      
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🎓 [PhD Analysis] Retrieved existing analysis:', {
      projectId,
      analysisDate: data.created_at,
      analysisType: data.analysis_type
    });
    
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('🎓 [PhD Analysis] Get proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve PhD analysis' },
      { status: 500 }
    );
  }
}
