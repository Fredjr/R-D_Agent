import { NextRequest, NextResponse } from 'next/server';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardDeepDiveRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/deep-dive`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('🔬 [Deep Dive] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('🔬 [Deep Dive] Request data:', {
      pmid: requestBody.pmid,
      title: requestBody.title?.substring(0, 50) + '...',
      objective: requestBody.objective,
      userId: userId
    });
  }

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : JSON.stringify(requestBody),
    redirect: "manual",
  });

  console.log('🔬 [Deep Dive] Backend response status:', upstream.status);

  if (!upstream.ok) {
    const errorText = await upstream.text();
    console.error('🔬 [Deep Dive] Backend error:', errorText);

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
  console.log('🔬 [Deep Dive] Backend success:', {
    hasResults: !!responseData.results_structured || !!responseData.source,
    hasDiagnostics: !!responseData.diagnostics,
    responseKeys: Object.keys(responseData)
  });

  // If this is a POST request and we have analysis results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Deep Dive] Attempting to save analysis to database...');

      const analysisData = {
        article_pmid: requestBody.pmid || responseData.source?.pmid,
        article_title: requestBody.title || responseData.source?.title,
        objective: requestBody.objective || 'Deep dive analysis',
        processing_status: 'completed',
        results: responseData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via the new deep-dive-analyses endpoint
      const baseUrl = req.url.split('/api/proxy/deep-dive')[0];
      const saveUrl = `${baseUrl}/api/proxy/deep-dive-analyses`;

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
        console.log('💾 [Deep Dive] Analysis saved successfully:', {
          analysisId: savedData.analysis_id || savedData.id
        });

        // Add analysis_id to response
        responseData.analysis_id = savedData.analysis_id || savedData.id;
        responseData.saved_to_database = true;
      } else {
        console.warn('💾 [Deep Dive] Failed to save analysis to database:', saveResponse.status);
        responseData.saved_to_database = false;
        responseData.save_error = await saveResponse.text();
      }
    } catch (saveError) {
      console.error('💾 [Deep Dive] Error saving analysis:', saveError);
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

export async function POST(req: Request) { return forwardDeepDiveRequest(req); }
export async function GET(req: Request) { return forwardDeepDiveRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}

