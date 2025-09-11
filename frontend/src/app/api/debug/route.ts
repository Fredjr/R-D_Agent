export async function GET() {
  // Test backend connectivity
  let backendStatus = "Unknown";
  let backendError = null;
  
  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://r-dagent-production.up.railway.app';
  
  try {
    const testResponse = await fetch(BACKEND_URL);
    backendStatus = testResponse.ok ? "Connected" : `Error ${testResponse.status}`;
    if (!testResponse.ok) {
      backendError = await testResponse.text();
    }
  } catch (error) {
    backendStatus = "Connection Failed";
    backendError = error instanceof Error ? error.message : "Unknown error";
  }

  return Response.json({
    environment: process.env.NODE_ENV,
    vercel_region: process.env.VERCEL_REGION || "Unknown",
    backend_urls: {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "Not set",
      BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || 'https://r-dagent-production.up.railway.app'
    },
    backend_connectivity: {
      status: backendStatus,
      error: backendError
    },
    timestamp: new Date().toISOString(),
  });
}
