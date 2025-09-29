import { NextRequest, NextResponse } from 'next/server';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardGenerateReviewRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/generate-review`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('📝 [Generate Review] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('📝 [Generate Review] Request data:', {
      molecule: requestBody.molecule?.substring(0, 50) + '...',
      objective: requestBody.objective,
      maxResults: requestBody.max_results,
      userId: userId
    });
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(requestBody),
    redirect: "manual",
  });

  console.log('📝 [Generate Review] Backend response status:', upstream.status);

  if (!upstream.ok) {
    const errorText = await upstream.text();
    console.error('📝 [Generate Review] Backend error:', errorText);

    const respHeaders = new Headers();
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, User-ID");
    respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

    return new Response(errorText, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders
    });
  }

  const responseData = await upstream.json();
  console.log('📝 [Generate Review] Backend success:', {
    hasResults: !!responseData.results,
    resultsCount: responseData.results?.length || 0,
    hasDiagnostics: !!responseData.diagnostics,
    responseKeys: Object.keys(responseData)
  });

  // If this is a POST request and we have results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Generate Review] Attempting to save analysis to database...');

      const analysisData = {
        molecule: requestBody.molecule,
        objective: requestBody.objective || 'Generate review analysis',
        processing_status: 'completed',
        results: responseData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Additional metadata
        max_results: requestBody.max_results,
        filters: requestBody.filters,
        search_strategy: requestBody.search_strategy,
        quality_threshold: requestBody.quality_threshold,
        fullTextOnly: requestBody.fullTextOnly
      };

      // Save to database via the new generate-review-analyses endpoint
      const baseUrl = req.url.split('/api/proxy/generate-review')[0];
      const saveUrl = `${baseUrl}/api/proxy/generate-review-analyses`;

      const saveResponse = await fetch(saveUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(analysisData),
      });

      if (saveResponse.ok) {
        const savedData = await saveResponse.json();
        console.log('💾 [Generate Review] Analysis saved successfully:', {
          analysisId: savedData.analysis_id || savedData.id || savedData.review_id
        });

        // Add analysis_id to response
        responseData.analysis_id = savedData.analysis_id || savedData.id || savedData.review_id;
        responseData.saved_to_database = true;
      } else {
        console.warn('💾 [Generate Review] Failed to save analysis to database:', saveResponse.status);
        responseData.saved_to_database = false;
        responseData.save_error = await saveResponse.text();
      }
    } catch (saveError) {
      console.error('💾 [Generate Review] Error saving analysis:', saveError);
      responseData.saved_to_database = false;
      responseData.save_error = saveError instanceof Error ? saveError.message : 'Unknown save error';
    }
  }

  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, User-ID");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  return new Response(JSON.stringify(responseData), {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders
  });
}

export async function POST(req: Request) { return forwardGenerateReviewRequest(req); }
export async function GET(req: Request) { return forwardGenerateReviewRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}

