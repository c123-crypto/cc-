/**
 * 造图台本地 Node.js 服务。
 * Node.js >= 18.18；API Key 只从每次请求头读取，不落盘、不写日志。
 */
import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { handleApiRequest } from './lib/api.js';

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 40 * 1024 * 1024;
const ROOT = path.dirname(fileURLToPath(import.meta.url));
const INDEX_FILE = path.join(ROOT, 'public', 'index.html');
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Gemini-Key, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, {
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...headers,
  });
  res.end(body);
}

function sendJSON(res, status, value, headers = {}) {
  send(res, status, JSON.stringify(value), {
    'Content-Type': 'application/json; charset=utf-8',
    ...headers,
  });
}

async function readRequestBody(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY) throw new Error('BODY_TOO_LARGE');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
}

async function sendFetchResponse(res, response) {
  send(res, response.status, Buffer.from(await response.arrayBuffer()), Object.fromEntries(response.headers.entries()));
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', `http://${req.headers.host || `localhost:${PORT}`}`);

  try {
    if (url.pathname === '/health') {
      return sendJSON(res, 200, { ok: true, runtime: 'node-local' });
    }

    if (url.pathname.startsWith('/api/')) {
      if (req.method === 'OPTIONS') return send(res, 204, '', CORS);
      if (req.method !== 'POST') {
        return sendJSON(res, 405, { error: '仅支持POST请求', code: 'METHOD_NOT_ALLOWED' }, { ...CORS, Allow: 'POST, OPTIONS' });
      }

      const endpoint = url.pathname.slice('/api/'.length).replace(/^\/+|\/+$/g, '');
      if (!endpoint || endpoint.includes('/')) {
        return sendJSON(res, 404, { error: '接口不存在', code: 'NOT_FOUND' }, CORS);
      }

      const request = new Request(url, {
        method: 'POST',
        headers: req.headers,
        body: await readRequestBody(req),
      });
      return sendFetchResponse(res, await handleApiRequest(request, endpoint));
    }

    if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
      return send(res, 200, await readFile(INDEX_FILE), { 'Content-Type': 'text/html; charset=utf-8' });
    }

    return sendJSON(res, 404, { error: '页面不存在', code: 'NOT_FOUND' });
  } catch (error) {
    const tooLarge = error?.message === 'BODY_TOO_LARGE';
    return sendJSON(res, tooLarge ? 413 : 500, {
      error: tooLarge ? '请求体不能超过40MB' : '本地服务暂时无法完成请求',
      code: tooLarge ? 'BODY_TOO_LARGE' : 'LOCAL_SERVER_ERROR',
    }, CORS);
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`造图台已启动：http://127.0.0.1:${PORT}`);
});
