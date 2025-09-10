import { NextRequest, NextResponse } from 'next/server';

// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Add user_id to the request body for the backend
    const requestBody = {
      user_id: body.user_id || body.email, // Use email as fallback user_id
      first_name: body.first_name,
      last_name: body.last_name,
      category: body.category,
      role: body.role,
      institution: body.institution,
      subject_area: body.subject_area,
      how_heard_about_us: body.how_heard_about_us,
      join_mailing_list: body.join_mailing_list || false
    };
    
    const response = await fetch(`${BACKEND_BASE}/auth/complete-registration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Auth complete registration proxy error:', error);
    return NextResponse.json(
      { detail: 'Internal server error' },
      { status: 500 }
    );
  }
}
