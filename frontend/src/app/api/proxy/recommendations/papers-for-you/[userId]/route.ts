import { NextRequest, NextResponse } from 'next/server';
import { handleProxyError, handleProxyException } from '@/lib/errorHandler';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const resolvedParams = await params;
    const { userId } = resolvedParams;
    console.log('📚 Processing Papers for You request for user:', userId);

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('project_id');
    const limit = searchParams.get('limit') || '12';

    // Forward headers
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');

    const userIdHeader = request.headers.get('User-ID');
    if (userIdHeader) {
      headers.set('User-ID', userIdHeader);
    }

    // NEW: Fetch from Weekly Mix API for personalized scores and explanations
    console.log('🎯 Fetching Weekly Mix for personalization data...');
    const weeklyMixUrl = `${BACKEND_BASE}/api/v1/weekly-mix/current`;
    const weeklyMixResponse = await fetch(weeklyMixUrl, { headers });

    let weeklyMixData: any = null;
    let weeklyMixMap = new Map<string, any>();

    if (weeklyMixResponse.ok) {
      weeklyMixData = await weeklyMixResponse.json();
      console.log(`✅ Weekly Mix loaded: ${weeklyMixData.papers?.length || 0} papers`);

      // Create a map of PMID -> personalization data
      weeklyMixData.papers?.forEach((paper: any) => {
        weeklyMixMap.set(paper.pmid, {
          personalization_score: paper.score,
          diversity_score: paper.diversity_score,
          recency_score: paper.recency_score,
          explanation: paper.explanation_text,
          explanation_confidence: paper.explanation_confidence
        });
      });
    } else {
      console.warn('⚠️ Weekly Mix API failed, continuing without personalization data');
    }

    // Build backend URL for papers-for-you
    let backendUrl = `${BACKEND_BASE}/recommendations/papers-for-you/${userId}?limit=${limit}`;
    if (projectId) {
      backendUrl += `&project_id=${projectId}`;
    }

    const response = await fetch(backendUrl, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      console.error('❌ Backend Papers for You failed:', response.status);
      return await handleProxyError(response, 'Papers for You', BACKEND_BASE);
    }

    const data = await response.json();

    // Enrich papers with Weekly Mix personalization data
    if (data.papers && weeklyMixMap.size > 0) {
      data.papers = data.papers.map((paper: any) => {
        const personalizationData = weeklyMixMap.get(paper.pmid);
        if (personalizationData) {
          console.log(`🎯 Enriching paper ${paper.pmid} with personalization data`);
          return {
            ...paper,
            ...personalizationData,
            // Keep original reason as fallback
            reason: personalizationData.explanation || paper.reason
          };
        }
        return paper;
      });
      console.log(`✅ Enriched ${data.papers.length} papers with personalization data`);
    }

    console.log('✅ Papers for You successful for user:', userId);
    return NextResponse.json(data);

  } catch (error) {
    console.error('❌ Papers for You proxy exception:', error);
    return handleProxyException(error, 'Papers for You', BACKEND_BASE);
  }
}
