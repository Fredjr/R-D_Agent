import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export async function GET() {
  try {
    const response = await fetch(`${BACKEND_URL}/feature-flags`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      // Don't cache feature flags - always get fresh values
      cache: 'no-store',
    });

    if (!response.ok) {
      console.warn('Feature flags endpoint returned non-OK status:', response.status);
      // Return defaults if backend endpoint not available
      return NextResponse.json({
        enable_new_home_page: false,
        enable_new_discover_page: false,
        enable_new_collections_page: false,
        enable_new_project_workspace: false,
        enable_new_lab_page: false,
        enable_global_triage: false,
        enable_erythos_theme: false,
      });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching feature flags:', error);
    // Return defaults on error
    return NextResponse.json({
      enable_new_home_page: false,
      enable_new_discover_page: false,
      enable_new_collections_page: false,
      enable_new_project_workspace: false,
      enable_new_lab_page: false,
      enable_global_triage: false,
      enable_erythos_theme: false,
    });
  }
}

