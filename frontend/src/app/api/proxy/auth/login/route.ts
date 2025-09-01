const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  "https://rd-backend-new-537209831678.us-central1.run.app"
).replace(/\/+$/, "");

export async function POST(req: Request) {
  try {
    const url = `${BACKEND_BASE}/auth/login`;
    
    const headers = new Headers(req.headers);
    headers.delete("host");
    headers.delete("connection");
    headers.delete("content-length");
    headers.delete("accept-encoding");

    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: await req.arrayBuffer(),
      redirect: 'manual',
    });

    const respHeaders = new Headers(upstream.headers);
    respHeaders.set("Access-Control-Allow-Origin", "*");
    respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    respHeaders.set("Access-Control-Allow-Methods", "POST,OPTIONS");
    
    return new Response(upstream.body, {
      status: upstream.status,
      statusText: upstream.statusText,
      headers: respHeaders,
    });
  } catch (error) {
    console.error("Auth proxy error:", error);
    return new Response(JSON.stringify({
      error: "Authentication service unavailable",
      message: error instanceof Error ? error.message : "Unknown error"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "POST,OPTIONS",
      "Access-Control-Max-Age": "600",
    },
  });
}
