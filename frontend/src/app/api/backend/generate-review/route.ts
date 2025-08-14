const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';

export async function POST(request: Request): Promise<Response> {
  try {
    const data = await request.json();
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), parseInt(process.env.PROXY_TIMEOUT_MS || '240000', 10));
    try {
      const upstream = await fetch(`${BACKEND_URL}/generate-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      });
      const text = await upstream.text();
      return new Response(text, {
        status: upstream.status,
        headers: { 'Content-Type': upstream.headers.get('Content-Type') || 'application/json' },
      });
    } catch (err: unknown) {
      const body = JSON.stringify({ error: 'Gateway timeout', detail: String(err) });
      return new Response(body, { status: 504, headers: { 'Content-Type': 'application/json' } });
    } finally {
      clearTimeout(t);
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Proxy error', detail: String(err) }), {
      status: 502,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204 });
}
