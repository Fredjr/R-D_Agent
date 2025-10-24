import { NextRequest, NextResponse } from 'next/server';
import { normalizeApiResponse } from '@/utils/apiResponseNormalizer';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardGenerateSummaryRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/generate-summary`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('📄 [Generate Summary] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('📄 [Generate Summary] Request data:', {
      projectId: requestBody.project_id,
      objective: requestBody.objective,
      summaryType: requestBody.summary_type,
      maxLength: requestBody.max_length,
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
    console.error('📄 [Generate Summary] Backend error:', {
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

  // Normalize response for backward compatibility
  const normalizedData = normalizeApiResponse(responseData, 'generate-summary');

  console.log('📄 [Generate Summary] Backend success:', {
    summaryType: normalizedData.summary_type,
    wordCount: normalizedData.word_count,
    qualityScore: normalizedData.quality_score,
    processingTime: normalizedData.processing_time,
    keyFindingsCount: normalizedData.key_findings?.length || 0,
    phdEnhancements: normalizedData.phd_enhancements ? 'Present' : 'None'
  });

  // If this is a POST request and we have summary results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Generate Summary] Attempting to save summary to database...');

      const summaryData = {
        project_id: requestBody.project_id,
        summary_type: requestBody.summary_type || 'comprehensive',
        objective: requestBody.objective || 'Generate comprehensive summary',
        processing_status: 'completed',
        results: normalizedData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via the backend
      const saveResponse = await fetch(`${BACKEND_BASE}/generate-summary-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(summaryData),
      });

      if (saveResponse.ok) {
        console.log('💾 [Generate Summary] Successfully saved to database');
      } else {
        console.warn('💾 [Generate Summary] Failed to save to database:', saveResponse.status);
      }

    } catch (saveError) {
      console.warn('💾 [Generate Summary] Database save error:', saveError);
      // Continue with response even if save fails
    }
  }

  return new Response(JSON.stringify(normalizedData), {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    },
  });
}

export async function POST(req: Request) { return forwardGenerateSummaryRequest(req); }
export async function GET(req: Request) { return forwardGenerateSummaryRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}
