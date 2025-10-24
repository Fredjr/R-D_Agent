import { NextRequest, NextResponse } from 'next/server';
import { normalizeApiResponse } from '@/utils/apiResponseNormalizer';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forwardThesisChapterRequest(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });

  const url = `${BACKEND_BASE}/thesis-chapter-generator`;
  const userId = req.headers.get('User-ID') || 'default_user';

  console.log('📖 [Thesis Chapter Generator] Processing request for user:', userId);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  // Get request body for POST requests
  let requestBody = null;
  if (req.method === "POST") {
    requestBody = await req.json();
    console.log('📖 [Thesis Chapter Generator] Request data:', {
      projectId: requestBody.project_id,
      objective: requestBody.objective,
      chapterFocus: requestBody.chapter_focus,
      academicLevel: requestBody.academic_level,
      citationStyle: requestBody.citation_style,
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
    console.error('📖 [Thesis Chapter Generator] Backend error:', {
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
  console.log('📖 [Thesis Chapter Generator] Backend success:', {
    chaptersCount: responseData.chapters?.length || 0,
    totalEstimatedWords: responseData.total_estimated_words,
    qualityScore: responseData.quality_score,
    processingTime: responseData.processing_time,
    estimatedCompletionTime: responseData.estimated_completion_time
  });

  // If this is a POST request and we have thesis results, save to database
  if (req.method === "POST" && responseData && requestBody) {
    try {
      console.log('💾 [Thesis Chapter Generator] Attempting to save thesis structure to database...');

      const thesisData = {
        project_id: requestBody.project_id,
        chapter_focus: requestBody.chapter_focus || 'comprehensive',
        objective: requestBody.objective || 'Generate thesis chapter structure',
        academic_level: requestBody.academic_level || 'phd',
        processing_status: 'completed',
        results: responseData,
        user_id: userId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Save to database via the backend
      const saveResponse = await fetch(`${BACKEND_BASE}/thesis-chapter-analyses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-ID': userId,
        },
        body: JSON.stringify(thesisData),
      });

      if (saveResponse.ok) {
        console.log('💾 [Thesis Chapter Generator] Successfully saved to database');
      } else {
        console.warn('💾 [Thesis Chapter Generator] Failed to save to database:', saveResponse.status);
      }

    } catch (saveError) {
      console.warn('💾 [Thesis Chapter Generator] Database save error:', saveError);
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

export async function POST(req: Request) { return forwardThesisChapterRequest(req); }
export async function GET(req: Request) { return forwardThesisChapterRequest(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}
