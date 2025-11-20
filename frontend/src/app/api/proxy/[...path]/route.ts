// Force Railway URL to bypass cached Vercel environment variables
const BACKEND_BASE = "https://r-dagent-production.up.railway.app";

function buildTargetUrl(req: Request, path: string[]): string {
  const suffix = path.join("/");
  const url = new URL(req.url);
  const search = url.search;

  // Always use the production backend as primary
  const backend = BACKEND_BASE || "https://r-dagent-production.up.railway.app";

  // Routes that need /api prefix (new pivot endpoints + Week 9-14 features)
  const needsApiPrefix = suffix.startsWith('questions') ||
                         suffix.startsWith('hypotheses') ||
                         suffix.startsWith('analytics') ||
                         suffix.startsWith('triage') ||
                         suffix.startsWith('decisions') ||
                         suffix.startsWith('alerts');

  const finalPath = needsApiPrefix ? `api/${suffix}` : suffix;

  const targetUrl = `${backend}/${finalPath}${search}`;

  console.log("Proxying request to:", targetUrl, {
    env_backend: BACKEND_BASE,
    path: path,
    original_suffix: suffix,
    needs_api_prefix: needsApiPrefix,
    final_path: finalPath,
    search: search
  });

  return targetUrl;
}

async function proxy(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  try {
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

    console.log("Making request to:", target);
    const upstream = await fetch(target, init);
    console.log("Upstream response:", upstream.status, upstream.statusText);

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
  } catch (error) {
    console.error("Proxy error:", error);
    return new Response(JSON.stringify({
      error: "Proxy configuration error",
      message: error instanceof Error ? error.message : "Unknown proxy error",
      backend_url: BACKEND_BASE || "Not configured"
    }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
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

