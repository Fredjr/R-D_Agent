export const runtime = 'edge';

const BACKEND_BASE = (
  process.env.NEXT_PUBLIC_BACKEND_URL || 
  process.env.BACKEND_URL || 
  "https://r-dagent-production.up.railway.app" // Fallback to your production backend
).replace(/\/+$/, "");

export async function POST(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });
  const url = `${BACKEND_BASE}/deep-dive-upload`;

  const headers = new Headers(req.headers);
  headers.delete("host"); headers.delete("connection"); headers.delete("content-length"); headers.delete("accept-encoding");

  const upstream = await fetch(url, {
    method: 'POST',
    headers,
    body: req.body,
    redirect: 'manual',
  });

  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  respHeaders.set("Access-Control-Allow-Methods", "POST,OPTIONS");
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: respHeaders });
}

export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}

