export async function GET() {
  return Response.json({
    environment: process.env.NODE_ENV,
    backend_urls: {
      NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL || "Not set",
      BACKEND_URL: process.env.BACKEND_URL || "Not set",
    },
    timestamp: new Date().toISOString(),
  });
}
