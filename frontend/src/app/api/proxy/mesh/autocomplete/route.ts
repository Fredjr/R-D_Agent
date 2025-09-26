// MeSH Autocomplete API Proxy Route
// Forwards requests to the backend MeSH autocomplete service

const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forward(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });
  
  // Extract query parameters from the request URL
  const url = new URL(req.url);
  const searchParams = url.searchParams;
  const backendUrl = `${BACKEND_BASE}/mesh/autocomplete?${searchParams.toString()}`;

  const headers = new Headers(req.headers);
  headers.delete("host"); 
  headers.delete("connection"); 
  headers.delete("content-length"); 
  headers.delete("accept-encoding");

  const upstream = await fetch(backendUrl, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });

  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization, User-ID");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  
  return new Response(upstream.body, { 
    status: upstream.status, 
    statusText: upstream.statusText, 
    headers: respHeaders 
  });
}

export async function GET(req: Request) { 
  return forward(req); 
}

export function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization, User-ID",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Max-Age": "600",
    }
  });
}
