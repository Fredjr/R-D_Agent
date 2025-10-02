import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ projectId: string }> }
) {
  try {
    const { projectId } = await params;
    const body = await request.json().catch(() => ({}));

    // Enhanced payload with PhD-specific options
    const enhancedPayload = {
      ...body,
      // PhD-specific analysis flags
      analysis_mode: body.analysis_type || 'comprehensive',
      phd_enhancements: {
        thesis_structure: body.analysis_type === 'thesis_structured',
        methodology_synthesis: body.include_methodology_synthesis || false,
        gap_analysis: body.include_gap_analysis || false,
        citation_analysis: body.include_citation_analysis || false,
        academic_writing: body.output_format === 'academic_chapters'
      },
      user_context: {
        academic_level: body.user_context?.academic_level || 'researcher',
        research_stage: body.user_context?.research_stage || 'general',
        citation_style: body.user_context?.preferred_citation_style || 'apa',
        ...body.user_context
      }
    };

    console.log('🎓 [PhD Summary] Enhanced analysis request:', {
      projectId,
      analysisMode: enhancedPayload.analysis_mode,
      phdEnhancements: enhancedPayload.phd_enhancements,
      userContext: enhancedPayload.user_context
    });

    const response = await fetch(`${BACKEND_URL}/projects/${projectId}/generate-comprehensive-summary`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': request.headers.get('User-ID') || 'default_user',
      },
      body: JSON.stringify(enhancedPayload),
      // No timeout - let it run as long as needed
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🎓 [PhD Summary] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🎓 [PhD Summary] Analysis complete:', {
      hasThesisStructure: !!data.thesis_chapters,
      hasGapAnalysis: !!data.gap_analysis,
      hasMethodologySynthesis: !!data.methodology_synthesis
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('🎓 [PhD Summary] Comprehensive project summary generation proxy error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
