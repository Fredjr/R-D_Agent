import { NextRequest, NextResponse } from 'next/server';

const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardBackgroundGenerateSummaryRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/background-jobs/generate-summary`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('🎓 [Background Generate Summary] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('🎓 [Background Generate Summary] Request data:', {
      projectId: requestBody.project_id,
      objective: requestBody.objective,
      summaryType: requestBody.summary_type,
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
    console.error('🎓 [Background Generate Summary] Backend error:', {
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
  console.log('🎓 [Background Generate Summary] Backend success:', {
    jobId: responseData.job_id,
    status: responseData.status,
    estimatedCompletion: responseData.estimated_completion,
    success: responseData.success
  });

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

export async function POST(req: Request) { return forwardBackgroundGenerateSummaryRequest(req); }
export async function GET(req: Request) { return forwardBackgroundGenerateSummaryRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}
