import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: false, // let the request stream for multipart
  },
};

const BACKEND_BASE = (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.BACKEND_URL || '').replace(/\/+$/, '');

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }
  if (!BACKEND_BASE) {
    res.status(500).send('Backend not configured');
    return;
  }
  const url = `${BACKEND_BASE}/deep-dive-upload`;

  const headers: Record<string, string> = {};
  Object.entries(req.headers).forEach(([k, v]) => {
    if (!v) return;
    if (['host','connection','content-length','accept-encoding'].includes(k.toLowerCase())) return;
    headers[k] = Array.isArray(v) ? v.join(',') : String(v);
  });

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers,
      body: req as any, // stream body
      redirect: 'manual',
    } as any);
    res.status(upstream.status);
    upstream.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    const buf = Buffer.from(await upstream.arrayBuffer());
    res.send(buf);
  } catch (e: any) {
    res.status(502).send(e?.message || 'Upstream error');
  }
}

