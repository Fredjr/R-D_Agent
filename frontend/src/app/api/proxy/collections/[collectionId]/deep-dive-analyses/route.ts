import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = "https://r-dagent-production.up.railway.app";

/**
 * POST /api/proxy/collections/[collectionId]/deep-dive-analyses
 * Create a new deep dive analysis from collection network node
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const body = await request.json();
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('🔬 [Collection Deep Dive] Creating analysis from collection:', collectionId, 'user:', userId);
    console.log('🔬 [Collection Deep Dive] Analysis data:', {
      pmid: body.pmid,
      title: body.title?.substring(0, 50) + '...',
      objective: body.objective,
      fromNetworkNode: !!body.network_node_id,
      projectId: body.project_id
    });

    // Enhance the body with collection context
    const enhancedBody = {
      ...body,
      collection_id: collectionId,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      processing_status: 'processing',
      // Collection network context
      source_context: 'collection_network',
      network_node_id: body.network_node_id,
      network_node_pmid: body.network_node_pmid,
      network_exploration_session: body.network_exploration_session
    };
    
    const response = await fetch(`${BACKEND_URL}/collections/${collectionId}/deep-dive-analyses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
      body: JSON.stringify(enhancedBody),
    });

    console.log('🔬 [Collection Deep Dive] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔬 [Collection Deep Dive] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔬 [Collection Deep Dive] Success:', {
      analysisId: data.analysis_id || data.id,
      collectionId: collectionId,
      projectId: body.project_id
    });

    // If project_id is provided, also save to project
    if (body.project_id && (data.analysis_id || data.id)) {
      try {
        console.log('🔬 [Collection Deep Dive] Saving to project:', body.project_id);
        
        const projectAnalysisData = {
          ...data,
          project_id: body.project_id,
          collection_id: collectionId,
          source_context: 'collection_network',
          network_node_id: body.network_node_id,
          network_node_pmid: body.network_node_pmid
        };

        const projectSaveResponse = await fetch(`${request.url.replace(`/collections/${collectionId}/deep-dive-analyses`, `/projects/${body.project_id}/deep-dive-analyses`)}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-ID': userId,
          },
          body: JSON.stringify(projectAnalysisData),
        });

        if (projectSaveResponse.ok) {
          const projectData = await projectSaveResponse.json();
          console.log('🔬 [Collection Deep Dive] Also saved to project:', {
            projectAnalysisId: projectData.analysis_id || projectData.id
          });
          data.project_analysis_id = projectData.analysis_id || projectData.id;
          data.saved_to_project = true;
        } else {
          console.warn('🔬 [Collection Deep Dive] Failed to save to project:', projectSaveResponse.status);
          data.saved_to_project = false;
        }
      } catch (projectSaveError) {
        console.error('🔬 [Collection Deep Dive] Error saving to project:', projectSaveError);
        data.saved_to_project = false;
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('🔬 [Collection Deep Dive] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/proxy/collections/[collectionId]/deep-dive-analyses
 * Retrieve deep dive analyses for a specific collection
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ collectionId: string }> }
) {
  try {
    const { collectionId } = await params;
    const userId = request.headers.get('User-ID') || 'default_user';
    
    console.log('🔬 [Collection Deep Dive] Fetching analyses for collection:', collectionId);
    
    const response = await fetch(`${BACKEND_URL}/collections/${collectionId}/deep-dive-analyses`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-ID': userId,
      },
    });

    console.log('🔬 [Collection Deep Dive] Backend response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔬 [Collection Deep Dive] Backend error:', errorText);
      return NextResponse.json(
        { error: `Backend error: ${errorText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('🔬 [Collection Deep Dive] Success:', {
      analysesCount: Array.isArray(data) ? data.length : 'N/A',
      collectionId: collectionId
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error('🔬 [Collection Deep Dive] Fetch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { 
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, User-ID',
    }
  });
}
