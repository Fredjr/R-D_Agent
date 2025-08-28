import { NextRequest } from "next/server";

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || "").replace(/\/+$/, "");

function buildTargetUrl(req: NextRequest, path: string[]): string {
  const suffix = encodeURI(path.join("/"));
  const search = req.nextUrl.search;
  if (!BACKEND_BASE) {
    throw new Error("Backend base URL is not configured");
  }
  return `${BACKEND_BASE}/${suffix}${search}`;
}

async function proxy(req: NextRequest, { params }: { params: { path: string[] } }) {
  const target = buildTargetUrl(req, params.path || []);

  const headers = new Headers(req.headers);
  headers.delete("host");
  headers.delete("connection");
  headers.delete("content-length");
  headers.delete("accept-encoding");

  const init: RequestInit = {
    method: req.method,
    headers,
    // For GET/HEAD, the body must be undefined
    body: req.method === "GET" || req.method === "HEAD" ? undefined : (req.body as unknown as ReadableStream<Uint8Array>),
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

export async function GET(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx);
}

export async function POST(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx);
}

export async function PUT(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx);
}

export async function PATCH(req: NextRequest, ctx: { params: { path: string[] } }) {
  return proxy(req, ctx);
}

export async function DELETE(req: NextRequest, ctx: { params: { path: string[] } }) {
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

