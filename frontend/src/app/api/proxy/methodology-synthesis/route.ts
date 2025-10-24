import { NextRequest, NextResponse } from 'next/server';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardMethodologySynthesisRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/methodology-synthesis`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('🧪 [Methodology Synthesis] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('🧪 [Methodology Synthesis] Request data:', {
      projectId: requestBody.project_id,
      objective: requestBody.objective,
      methodologyTypes: requestBody.methodology_types,
      includeStatisticalMethods: requestBody.include_statistical_methods,
      includeValidation: requestBody.include_validation,
      comparisonDepth: requestBody.comparison_depth,
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
    console.error('🧪 [Methodology Synthesis] Backend error:', {
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
  console.log('🧪 [Methodology Synthesis] Backend success:', {
    identifiedMethodologiesCount: responseData.identified_methodologies?.length || 0,
    methodologyComparisonCount: responseData.methodology_comparison?.length || 0,
    statisticalMethodsCount: responseData.statistical_methods?.length || 0,
    validationApproachesCount: responseData.validation_approaches?.length || 0,
    recommendationsCount: responseData.methodology_recommendations?.length || 0,
    qualityScore: responseData.quality_score,
    processingTime: responseData.processing_time
  });

  // If this is a POST request and we have methodology synthesis results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Methodology Synthesis] Attempting to save methodology synthesis to database...');

      const methodologyData = {
        project_id: requestBody.project_id,
        methodology_types: requestBody.methodology_types || ['experimental', 'observational', 'computational'],
        objective: requestBody.objective || 'Synthesize research methodologies',
        comparison_depth: requestBody.comparison_depth || 'detailed',
        processing_status: 'completed',
        results: responseData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via the backend
      const saveResponse = await fetch(`${BACKEND_BASE}/methodology-synthesis-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(methodologyData),
      });

      if (saveResponse.ok) {
        console.log('💾 [Methodology Synthesis] Successfully saved to database');
      } else {
        console.warn('💾 [Methodology Synthesis] Failed to save to database:', saveResponse.status);
      }

    } catch (saveError) {
      console.warn('💾 [Methodology Synthesis] Database save error:', saveError);
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

export async function POST(req: Request) { return forwardMethodologySynthesisRequest(req); }
export async function GET(req: Request) { return forwardMethodologySynthesisRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}
