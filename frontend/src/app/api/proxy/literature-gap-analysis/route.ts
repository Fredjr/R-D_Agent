import { NextRequest, NextResponse } from 'next/server';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardLiteratureGapAnalysisRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/literature-gap-analysis`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('🔍 [Literature Gap Analysis] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('🔍 [Literature Gap Analysis] Request data:', {
      projectId: requestBody.project_id,
      objective: requestBody.objective,
      gapTypes: requestBody.gap_types,
      domainFocus: requestBody.domain_focus,
      severityThreshold: requestBody.severity_threshold,
      academicLevel: requestBody.academic_level,
      userId: userId
    });
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(requestBody),
    redirect: "manual",
  });

  if (!upstream.ok) {
    const errorText = await upstream.text();
    console.error('🔍 [Literature Gap Analysis] Backend error:', {
      status: upstream.status,
      statusText: upstream.statusText,
      error: errorText
    });
    
    return new Response(errorText, {
      status: upstream.status,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
        "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      },
    });
  }

  const responseData = await upstream.json();
  console.log('🔍 [Literature Gap Analysis] Backend success:', {
    identifiedGapsCount: responseData.identified_gaps?.length || 0,
    researchOpportunitiesCount: responseData.research_opportunities?.length || 0,
    methodologyGapsCount: responseData.methodology_gaps?.length || 0,
    theoreticalGapsCount: responseData.theoretical_gaps?.length || 0,
    empiricalGapsCount: responseData.empirical_gaps?.length || 0,
    qualityScore: responseData.quality_score,
    processingTime: responseData.processing_time
  });

  // If this is a POST request and we have gap analysis results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Literature Gap Analysis] Attempting to save gap analysis to database...');

      const gapAnalysisData = {
        project_id: requestBody.project_id,
        gap_types: requestBody.gap_types || ['theoretical', 'methodological', 'empirical'],
        objective: requestBody.objective || 'Identify research gaps',
        domain_focus: requestBody.domain_focus,
        processing_status: 'completed',
        results: responseData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via the backend
      const saveResponse = await fetch(`${BACKEND_BASE}/literature-gap-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(gapAnalysisData),
      });

      if (saveResponse.ok) {
        console.log('💾 [Literature Gap Analysis] Successfully saved to database');
      } else {
        console.warn('💾 [Literature Gap Analysis] Failed to save to database:', saveResponse.status);
      }

    } catch (saveError) {
      console.warn('💾 [Literature Gap Analysis] Database save error:', saveError);
      // Continue with response even if save fails
    }
  }

  return new Response(JSON.stringify(responseData), {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export async function POST(req: Request) { return forwardLiteratureGapAnalysisRequest(req); }
export async function GET(req: Request) { return forwardLiteratureGapAnalysisRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}
