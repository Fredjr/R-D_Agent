const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");

async function forward(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });
  const url = `${BACKEND_BASE}/deep-dive`;

  const headers = new Headers(req.headers);
  headers.delete("host"); headers.delete("connection"); headers.delete("content-length"); headers.delete("accept-encoding");

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });

  const respHeaders = new Headers(upstream.headers);
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  return new Response(upstream.body, { status: upstream.status, statusText: upstream.statusText, headers: respHeaders });
}

export async function POST(req: Request) { return forward(req); }
export async function GET(req: Request) { return forward(req); }
export function OPTIONS() {
  return new Response(null, { status: 204, headers: {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Max-Age": "600",
  }});
}

