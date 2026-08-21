import assert from 'node:assert/strict';
import test from 'node:test';

import worker from '../worker.js';

const env = {
  ASSETS: {
    fetch: async () => new Response('<!doctype html><title>asset</title>', {
      headers: { 'content-type': 'text/html; charset=utf-8' },
    }),
  },
};

function apiRequest(endpoint, body, headers = {}) {
  return new Request(`https://example.test/api/${endpoint}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
}

test('health, assets, method and unknown route contracts', async () => {
  const health = await worker.fetch(new Request('https://example.test/health'), env);
  assert.equal(health.status, 200);
  assert.deepEqual(await health.json(), { ok: true, runtime: 'cloudflare-worker' });

  const asset = await worker.fetch(new Request('https://example.test/'), env);
  assert.equal(asset.status, 200);
  assert.match(await asset.text(), /<title>asset<\/title>/);

  const method = await worker.fetch(new Request('https://example.test/api/analyze'), env);
  assert.equal(method.status, 405);
  assert.equal((await method.json()).code, 'METHOD_NOT_ALLOWED');

  const missing = await worker.fetch(apiRequest('unknown', {}), env);
  assert.equal(missing.status, 404);
  assert.equal((await missing.json()).code, 'NOT_FOUND');
});

test('validation errors do not call an upstream model', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected upstream call'); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const missingKey = await worker.fetch(apiRequest('analyze', {}), env);
  assert.equal(missingKey.status, 400);
  assert.equal((await missingKey.json()).code, 'TEXT_KEY_REQUIRED');

  const missingPrompt = await worker.fetch(apiRequest('tool-image', {
    toolId: 'product-shot',
    provider: 'gemini',
  }, { 'x-gemini-key': 'test-key' }), env);
  assert.equal(missingPrompt.status, 400);
  assert.equal((await missingPrompt.json()).code, 'PROMPT_REQUIRED');
  assert.equal(calls, 0);
});

test('image generation falls back after rate limiting and reports the used model', async (t) => {
  const originalFetch = globalThis.fetch;
  const urls = [];
  globalThis.fetch = async (url) => {
    urls.push(String(url));
    if (String(url).includes('generativelanguage.googleapis.com')) {
      return Response.json({ error: { message: 'rate_limit exceeded' } }, { status: 429 });
    }
    if (String(url).includes('ark.cn-beijing.volces.com/api/v3/images/generations')) {
      return Response.json({ data: [{ b64_json: 'ZmFrZS1pbWFnZQ==' }] });
    }
    throw new Error(`unexpected URL: ${url}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-image', {
    toolId: 'product-shot',
    provider: 'gemini',
    prompt: '白底商品棚拍',
    allowFallback: true,
  }, {
    'x-gemini-key': 'test-gemini-key',
    'x-ark-key': 'test-ark-key',
  }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'seedream');
  assert.equal(body.requestedProvider, 'gemini');
  assert.equal(body.fallback, true);
  assert.equal(body.fallbackFrom, 'Nano Banana 2');
  assert.equal(body.fallbackCode, 'RATE_LIMIT');
  assert.equal(body.image, 'data:image/jpeg;base64,ZmFrZS1pbWFnZQ==');
  assert.equal(urls.length, 2);
});

test('content safety rejection stops fallback', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ error: { message: 'content safety policy' } }, { status: 400 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-image', {
    toolId: 'product-shot',
    provider: 'gemini',
    prompt: '测试提示词',
    allowFallback: true,
  }, {
    'x-gemini-key': 'test-gemini-key',
    'x-ark-key': 'test-ark-key',
  }), env);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, 'CONTENT_BLOCKED');
  assert.equal(calls, 1);
});

test('automatic fallback can be disabled', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return Response.json({ error: { message: 'rate_limit exceeded' } }, { status: 429 });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-image', {
    toolId: 'product-shot',
    provider: 'gemini',
    prompt: '测试提示词',
    allowFallback: false,
  }, {
    'x-gemini-key': 'test-gemini-key',
    'x-ark-key': 'test-ark-key',
  }), env);
  const body = await response.json();

  assert.equal(response.status, 429);
  assert.equal(body.code, 'RATE_LIMIT');
  assert.equal(calls, 1);
});

test('Ark prompt planning accepts server-sent-event JSON responses', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response(
    `data: ${JSON.stringify({ choices: [{ message: { content: JSON.stringify({ summary: '已识别商品', prompts: [{ label: '结果 1', prompt: '保持商品真实并移除背景' }] }) } }] })}\n\ndata: [DONE]\n`,
    { status: 200, headers: { 'content-type': 'text/event-stream' } },
  );
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-prompt', {
    toolId: 'cutout',
    note: '移除背景',
    outputCount: 1,
    provider: 'seedream',
    textProvider: 'doubao',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'doubao');
  assert.equal(body.prompts.length, 1);
  assert.equal(body.prompts[0].prompt, '保持商品真实并移除背景');
});

test('Ark prompt planning accepts plain-text gateway responses', async (t) => {
  const originalFetch = globalThis.fetch;
  const plan = JSON.stringify({ summary: '已识别商品', prompts: [{ label: '结果 1', prompt: '纯白背景商品图' }] });
  globalThis.fetch = async () => new Response(plan, {
    status: 200,
    headers: { 'content-type': 'text/plain; charset=utf-8' },
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-prompt', {
    toolId: 'product-shot',
    note: '白底棚拍',
    outputCount: 1,
    provider: 'seedream',
    textProvider: 'doubao',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.prompts[0].prompt, '纯白背景商品图');
});

test('unparseable Ark responses return a useful configuration error', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => new Response('<html>proxy error</html>', {
    status: 200,
    headers: { 'content-type': 'text/html' },
  });
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-prompt', {
    toolId: 'cutout',
    note: '移除背景',
    outputCount: 1,
    provider: 'seedream',
    textProvider: 'doubao',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.code, 'ARK_CHAT_FORMAT');
  assert.match(body.error, /模型名称、Endpoint和代理配置/);
});

test('DeepSeek can be selected as the Ark text model', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  let requestedUrl;
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    sentBody = JSON.parse(options.body);
    return Response.json({ output: [{ type: 'message', content: [{ type: 'output_text', text: '通过' }] }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'doubao',
    arkTextModel: 'deepseek-v4-pro-ga-260813 4.',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.match(requestedUrl, /\/api\/v3\/responses$/);
  assert.equal(sentBody.model, 'deepseek-v4-pro-ga-260813');
  assert.equal(sentBody.input, '只回复两个字：通过');
  assert.equal(body.model, 'deepseek-v4-pro-ga-260813');
  assert.match(body.message, /DeepSeek/);
});

test('Ark Responses API accepts the output_text shortcut', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return calls === 1
      ? new Response('<html>chat gateway mismatch</html>', { status: 200, headers: { 'content-type': 'text/html' } })
      : Response.json({ output_text: '通过' });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'doubao',
    arkTextModel: 'deepseek-v4-flash-test',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.ok, true);
});

test('Ark Responses API accepts SSE completed and delta events', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response('<html>chat gateway mismatch</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    return new Response([
      'event: response.output_text.delta',
      'data: {"type":"response.output_text.delta","delta":"通"}',
      '',
      'event: response.output_text.delta',
      'data: {"type":"response.output_text.delta","delta":"过"}',
      '',
      'data: [DONE]',
    ].join('\n'), { status: 200, headers: { 'content-type': 'text/event-stream' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'doubao',
    arkTextModel: 'deepseek-v4-pro-test',
  }, { 'x-ark-key': 'test-ark-key' }), env);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('image-backed text tools use the multimodal model instead of DeepSeek', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (_url, options) => {
    sentBody = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: '已识别商品' } }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-text', {
    toolId: 'text-copywriter',
    note: '生成卖点文案',
    imageBase64s: ['data:image/png;base64,AA=='],
    textProvider: 'doubao',
    arkTextModel: 'deepseek-v4-pro-ga-260813',
    visionModel: 'doubao-seed-2-1-pro-test',
  }, { 'x-ark-key': 'test-ark-key' }), env);

  assert.equal(response.status, 200);
  assert.equal(sentBody.model, 'doubao-seed-2-1-pro-test');
  assert.equal(sentBody.messages[0].content[1].type, 'image_url');
});
