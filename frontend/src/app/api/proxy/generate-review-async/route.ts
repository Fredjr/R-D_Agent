// Async generate-review endpoint
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

async function forward(req: Request) {
  if (!BACKEND_BASE) return new Response("Backend not configured", { status: 500 });
  const url = `${BACKEND_BASE}/generate-review-async`;

  const headers = new Headers(req.headers);
  headers.delete("host"); 
  headers.delete("connection"); 
  headers.delete("content-length"); 
  headers.delete("accept-encoding");

  const upstream = await fetch(url, {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: upstream.headers,
  });
}

export const POST = forward;
export const OPTIONS = () => new Response(null, { status: 204 });
