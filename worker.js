import { handleApiRequest } from './lib/api.js';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return Response.json({ ok: true, runtime: 'cloudflare-worker' }, {
        headers: { 'Cache-Control': 'no-store' },
      });
    }

    if (url.pathname.startsWith('/api/')) {
      if (request.method === 'OPTIONS') {
        return new Response(null, { status: 204, headers: CORS });
      }
      if (request.method !== 'POST') {
        return Response.json({ error: '仅支持POST请求', code: 'METHOD_NOT_ALLOWED' }, {
          status: 405,
          headers: { ...CORS, Allow: 'POST, OPTIONS' },
        });
      }

      const endpoint = url.pathname.slice('/api/'.length).replace(/^\/+|\/+$/g, '');
      if (!endpoint || endpoint.includes('/')) {
        return Response.json({ error: '接口不存在', code: 'NOT_FOUND' }, {
          status: 404,
          headers: CORS,
        });
      }
      return handleApiRequest(request, endpoint);
    }

    return env.ASSETS.fetch(request);
  },
};
