import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Helper to parse boolean env vars
function parseEnvBool(value: string | undefined): boolean {
  return value === 'true' || value === '1';
}

// Get flags from environment variables (fallback)
function getEnvFlags() {
  return {
    enable_new_home_page: parseEnvBool(process.env.ENABLE_NEW_HOME_PAGE),
    enable_new_discover_page: parseEnvBool(process.env.ENABLE_NEW_DISCOVER_PAGE),
    enable_new_collections_page: parseEnvBool(process.env.ENABLE_NEW_COLLECTIONS_PAGE),
    enable_new_project_workspace: parseEnvBool(process.env.ENABLE_NEW_PROJECT_WORKSPACE),
    enable_new_lab_page: parseEnvBool(process.env.ENABLE_NEW_LAB_PAGE),
    enable_global_triage: parseEnvBool(process.env.ENABLE_GLOBAL_TRIAGE),
    enable_erythos_theme: parseEnvBool(process.env.ENABLE_ERYTHOS_THEME),
  };
}

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
      // Fallback to environment variables
      return NextResponse.json(getEnvFlags());
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching feature flags from backend, using env vars:', error);
    // Fallback to environment variables
    return NextResponse.json(getEnvFlags());
  }
}

