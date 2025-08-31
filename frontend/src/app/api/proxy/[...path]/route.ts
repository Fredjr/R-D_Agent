const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");

function buildTargetUrl(req: Request, path: string[]): string {
  const suffix = encodeURI(path.join("/"));
  const url = new URL(req.url);
  const search = url.search;
  if (!BACKEND_BASE) {
    throw new Error("Backend base URL is not configured");
  }
  return `${BACKEND_BASE}/${suffix}${search}`;
}

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const resolvedParams = await params;
  const target = buildTargetUrl(req, resolvedParams.path || []);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  const init: RequestInit = {
    method: req.method,
    headers,
    body: req.method === "GET" || req.method === "HEAD" ? undefined : await req.arrayBuffer(),
    redirect: "manual",
  };

  const upstream = await fetch(target, init);

  const respHeaders = new Headers(upstream.headers);
  // Ensure responses are cache-bypassed and CORS-safe on same-origin
  respHeaders.set("Access-Control-Allow-Origin", "*");
  respHeaders.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  respHeaders.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: respHeaders,
  });
}

export async function GET(req: Request, ctx: any) {
  return proxy(req, ctx);
}

export async function POST(req: Request, ctx: any) {
  return proxy(req, ctx);
}

export async function PUT(req: Request, ctx: any) {
  return proxy(req, ctx);
}

export async function PATCH(req: Request, ctx: any) {
  return proxy(req, ctx);
}

export async function DELETE(req: Request, ctx: any) {
  return proxy(req, ctx);
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      "Access-Control-Max-Age": "600",
    },
  });
}

