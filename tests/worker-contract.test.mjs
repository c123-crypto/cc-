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

test('download proxy converts an approved temporary model URL into a same-origin image response', async (t) => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (url) => {
    assert.equal(String(url), 'https://example.tos-cn-beijing.volces.com/generated/result.png');
    return new Response(new Uint8Array([137, 80, 78, 71]), { headers: { 'content-type': 'image/png', 'content-length': '4' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('download-image', {
    url: 'https://example.tos-cn-beijing.volces.com/generated/result.png',
  }), env);

  assert.equal(response.status, 200);
  assert.equal(response.headers.get('content-type'), 'image/png');
  assert.deepEqual([...new Uint8Array(await response.arrayBuffer())], [137, 80, 78, 71]);
});

test('download proxy rejects arbitrary hosts without fetching them', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected fetch'); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('download-image', { url: 'https://attacker.example/private' }), env);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, 'IMAGE_DOWNLOAD_URL_REJECTED');
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

test('multi-scene prompt planning turns duplicate model output into distinct image tasks', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  const repeated = Array.from({ length: 4 }, () => ({ label: '场景图', prompt: '把商品放在好看的室内场景中' }));
  globalThis.fetch = async (_url, options) => {
    sentBody = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ summary: '场景规划', prompts: repeated }) } }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-prompt', {
    toolId: 'product-shot',
    note: '生成收纳盒真实使用图',
    outputCount: 4,
    sceneMode: 'lifestyle',
    provider: 'seedream',
    textProvider: 'doubao',
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.prompts.length, 4);
  assert.equal(new Set(body.prompts.map(item => item.label)).size, 4);
  assert.equal(new Set(body.prompts.map(item => item.prompt)).size, 4);
  assert.match(body.series_style, /整套统一视觉合同/);
  assert.match(body.prompts[0].prompt, /日间居家使用/);
  assert.match(body.prompts[1].prompt, /第二空间使用/);
  assert.match(body.prompts[2].prompt, /近景互动/);
  assert.match(body.prompts[3].prompt, /远景环境关系/);
  assert.match(JSON.stringify(sentBody), /禁止拼图、分屏、多宫格/);
  assert.match(JSON.stringify(sentBody), /只允许画面任务、商品摆位和机位按分镜变化/);
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
  assert.match(body.error, /HTTP 200，text\/html，24字节/);
});

test('Gemini project planning understands grouped product and scene references before planning', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    sentBody = JSON.parse(options.body);
    return Response.json({
      status: 'completed',
      output_text: JSON.stringify({
        product_summary: '白色收纳盒',
        reference_strategy: '轮换正面、侧面与场景参考',
        white_prompt: '保持白色收纳盒外观，生成白底图',
        series: [
          { label: '核心卖点场景', product_refs: [1, 2], style_ref: 1, prompt: '场景提示词' },
          { label: '材质做工细节', product_refs: [3], style_ref: 1, prompt: '细节提示词' },
          { label: '尺寸使用感知', product_refs: [2], style_ref: 1, prompt: '尺寸提示词' },
          { label: '转化留白构图', product_refs: [1], style_ref: 1, prompt: '留白提示词' },
        ],
      }),
    });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('analyze', {
    imageBase64: 'data:image/png;base64,AA==',
    productImagesBase64s: ['data:image/png;base64,AA==', 'data:image/png;base64,AQ==', 'data:image/png;base64,Ag=='],
    styleImagesBase64s: ['data:image/png;base64,Aw=='],
    platform: 'taobao',
    suiteType: 'square',
    textProvider: 'gemini',
    imageProvider: 'openai',
  }, { 'x-gemini-key': 'test-gemini-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'gemini');
  assert.equal(body.series.length, 4);
  assert.deepEqual(body.series[0].product_refs, [1, 2]);
  assert.equal(body.series[0].style_ref, 1);
  assert.equal(body.reference_strategy, '轮换正面、侧面与场景参考');
  assert.equal(sentBody.input.filter(item => item.type === 'image').length, 4);
  assert.match(sentBody.input[0].text, /前 3 张是同一商品的商品证据图/);
  assert.match(sentBody.input[0].text, /后 1 张是场景\/风格参考图/);
  assert.match(sentBody.input[0].text, /先从商品证据图分析商品身份、真实功能、结构材质、目标买家、使用痛点和购买理由/);
  assert.match(sentBody.input[0].text, /只有“同背景真实使用”这一张纯场景图允许 headline 和 subheadline 为空/);
  assert.match(sentBody.input[0].text, /不得使用“核心卖点、使用痛点、购买理由、第几张、商品证据图、请核对、完成转化”/);
  assert.deepEqual(sentBody.response_format, { type: 'text', mime_type: 'application/json' });
  assert.equal(sentBody.generation_config.max_output_tokens, 3000);
});

test('scene-only project planning uses all five square slots for different scenes', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (url, options) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    sentBody = JSON.parse(options.body);
    return Response.json({
      status: 'completed',
      output_text: JSON.stringify({
        product_name: '折叠收纳盒',
        product_summary: '可折叠收纳盒',
        reference_strategy: '五张图轮换环境、机位和光线',
        white_prompt: '不应使用',
        series: [
          { product_refs: [1], style_ref: 1, prompt: '客厅核心卖点场景' },
          { product_refs: [2], style_ref: 2, prompt: '卧室日常使用场景' },
          { product_refs: [1, 2], style_ref: 1, prompt: '材质细节场景' },
          { product_refs: [2], style_ref: 2, prompt: '尺寸感知场景' },
          { product_refs: [1], style_ref: 1, prompt: '转化留白场景' },
        ],
      }),
    });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('analyze', {
    imageBase64: 'data:image/png;base64,AA==',
    productImagesBase64s: ['data:image/png;base64,AA==', 'data:image/png;base64,AQ=='],
    styleImagesBase64s: ['data:image/png;base64,Ag==', 'data:image/png;base64,Aw=='],
    platform: 'taobao',
    suiteType: 'square',
    includeWhite: false,
    textProvider: 'gemini',
    imageProvider: 'gemini',
  }, { 'x-gemini-key': 'test-gemini-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.product_name, '折叠收纳盒');
  assert.equal(body.white_prompt, '');
  assert.equal(body.series.length, 5);
  assert.deepEqual(body.roles, ['核心卖点场景', '日常使用场景', '材质做工细节', '尺寸使用感知', '转化留白构图']);
  assert.match(sentBody.input[0].text, /本套不生成白底图/);
  assert.match(sentBody.input[0].text, /全部输出名额都必须用于彼此不同的真实场景图/);
});

test('prompt planning preserves the selected provider error when Ark fallback hits 525', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async (url) => {
    calls += 1;
    if (String(url).includes('generativelanguage.googleapis.com')) {
      return Response.json({ status: 'completed', output_text: 'not json' });
    }
    return new Response('error code: 525', { status: 525, headers: { 'content-type': 'text/plain' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('analyze', {
    imageBase64: 'data:image/png;base64,AA==',
    platform: 'pdd',
    suiteType: 'square',
    textProvider: 'gemini',
    imageProvider: 'openai',
  }, {
    'x-gemini-key': 'test-gemini-key',
    'x-ark-key': 'test-ark-key',
  }), env);
  const body = await response.json();

  assert.equal(response.status, 502);
  assert.equal(body.code, 'MODEL_JSON_INVALID');
  assert.equal(body.providerFailures.length, 2);
  assert.equal(body.providerFailures[0].provider, 'gemini');
  assert.equal(body.providerFailures[0].code, 'MODEL_JSON_INVALID');
  assert.equal(body.providerFailures[1].provider, 'doubao');
  assert.equal(body.providerFailures[1].code, 'ARK_CHAT_TLS_525');
  assert.equal(calls, 4);
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

test('Ark Responses API accepts successful non-HTML raw text', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls === 1) return new Response('<html>chat gateway mismatch</html>', { status: 200, headers: { 'content-type': 'text/html' } });
    return new Response('通过', { status: 200, headers: { 'content-type': 'application/octet-stream' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'doubao',
    arkTextModel: 'deepseek-v4-pro-test',
  }, { 'x-ark-key': 'test-ark-key' }), env);

  assert.equal(response.status, 200);
  assert.equal((await response.json()).ok, true);
});

test('Ark TLS 525 responses are retried before parsing', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    if (calls < 3) return new Response('SSL handshake', { status: 525, headers: { 'content-type': 'text/plain' } });
    return Response.json({ choices: [{ message: { content: '通过' } }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'doubao',
    arkTextModel: 'deepseek-v4-pro-test',
  }, { 'x-ark-key': 'test-ark-key' }), env);

  assert.equal(response.status, 200);
  assert.equal(calls, 3);
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

test('Qwen prompt planning uses the regional OpenAI-compatible vision endpoint', async (t) => {
  const originalFetch = globalThis.fetch;
  let requestedUrl;
  let sentBody;
  globalThis.fetch = async (url, options) => {
    requestedUrl = String(url);
    sentBody = JSON.parse(options.body);
    return Response.json({ choices: [{ message: { content: JSON.stringify({ summary: '千问已理解商品', prompts: [{ label: '场景 1', prompt: '真实客厅使用场景' }] }) } }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-prompt', {
    toolId: 'product-shot',
    note: '生成场景图',
    imageBase64s: ['data:image/png;base64,AA=='],
    outputCount: 1,
    provider: 'qwen',
    textProvider: 'qwen',
    qwenVisionModel: 'qwen3-vl-plus',
    qwenEndpoint: 'https://dashscope-intl.aliyuncs.com',
  }, { 'x-qwen-key': 'test-qwen-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'qwen');
  assert.equal(body.model, 'qwen3-vl-plus');
  assert.equal(requestedUrl, 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions');
  assert.equal(sentBody.messages[0].content[0].type, 'image_url');
  assert.equal(sentBody.messages[0].content.at(-1).type, 'text');
  assert.deepEqual(sentBody.response_format, { type: 'json_object' });
});

test('Qwen Image edits reference images through the native multimodal endpoint', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  let calls = 0;
  globalThis.fetch = async (url, options = {}) => {
    calls += 1;
    if (String(url).includes('/multimodal-generation/generation')) {
      sentBody = JSON.parse(options.body);
      return Response.json({ output: { choices: [{ message: { content: [{ image: 'https://dashscope-result.oss-cn-shenzhen.aliyuncs.com/result.png' }] } }] } });
    }
    if (String(url) === 'https://dashscope-result.oss-cn-shenzhen.aliyuncs.com/result.png') {
      return new Response(new Uint8Array([1, 2, 3]), { headers: { 'content-type': 'image/png' } });
    }
    throw new Error(`unexpected URL: ${url}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('tool-image', {
    toolId: 'qwen-image-studio',
    provider: 'qwen',
    prompt: '真实厨房使用场景',
    imageBase64s: ['data:image/png;base64,AA==', 'data:image/png;base64,AQ=='],
    aspect: 'wide',
    allowFallback: false,
    qwenImageModel: 'qwen-image-2.0-pro',
    qwenEndpoint: 'https://dashscope.aliyuncs.com',
  }, { 'x-qwen-key': 'test-qwen-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'qwen');
  assert.equal(body.model, 'qwen-image-2.0-pro');
  assert.equal(body.image, 'data:image/png;base64,AQID');
  assert.equal(sentBody.input.messages[0].content.filter(item => item.image).length, 2);
  assert.equal(sentBody.parameters.size, '1536*1024');
  assert.equal(sentBody.parameters.n, 1);
  assert.equal(calls, 2);
});

test('suite image generation forwards a different three-reference bundle for each scene', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (url, options = {}) => {
    if (String(url).includes('/multimodal-generation/generation')) {
      sentBody = JSON.parse(options.body);
      return Response.json({ output: { choices: [{ message: { content: [{ image: 'https://dashscope-result.oss-cn-shenzhen.aliyuncs.com/suite.png' }] } }] } });
    }
    if (String(url) === 'https://dashscope-result.oss-cn-shenzhen.aliyuncs.com/suite.png') {
      return new Response(new Uint8Array([4, 5, 6]), { headers: { 'content-type': 'image/png' } });
    }
    throw new Error(`unexpected URL: ${url}`);
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('series-image', {
    provider: 'qwen',
    prompt: '窗边生活场景，侧前方中景，只生成一张图',
    whiteImageBase64: 'data:image/png;base64,AA==',
    referenceImagesBase64s: [
      'data:image/png;base64,AA==',
      'data:image/png;base64,AQ==',
      'data:image/png;base64,Ag==',
      'data:image/png;base64,Aw==',
    ],
    allowFallback: false,
    qwenImageModel: 'qwen-image-3.0-pro',
  }, { 'x-qwen-key': 'test-qwen-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'qwen');
  assert.equal(sentBody.input.messages[0].content.filter(item => item.image).length, 3);
  assert.match(sentBody.input.messages[0].content.at(-1).text, /窗边生活场景/);
});

test('Seedream suite generation keeps four focused references instead of globally truncating to three', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (url, options = {}) => {
    assert.match(String(url), /ark\.cn-beijing\.volces\.com\/api\/v3\/images\/generations/);
    sentBody = JSON.parse(options.body);
    return Response.json({ data: [{ b64_json: 'BAUG' }] });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const refs = [
    'data:image/png;base64,AA==',
    'data:image/png;base64,AQ==',
    'data:image/png;base64,Ag==',
    'data:image/png;base64,Aw==',
  ];
  const response = await worker.fetch(apiRequest('series-image', {
    provider: 'seedream',
    prompt: '独立厨房使用场景，参考图4只提供环境和光线',
    referenceImagesBase64s: refs,
    allowFallback: false,
  }, { 'x-ark-key': 'test-ark-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.provider, 'seedream');
  assert.equal(sentBody.image.length, 4);
  assert.deepEqual(sentBody.image, refs);
});

test('quality control compares the result with original product evidence before the white baseline', async (t) => {
  const originalFetch = globalThis.fetch;
  let sentBody;
  globalThis.fetch = async (url, options = {}) => {
    assert.match(String(url), /generativelanguage\.googleapis\.com\/v1beta\/interactions/);
    sentBody = JSON.parse(options.body);
    return Response.json({ status: 'completed', output_text: JSON.stringify({ pass: true, score: 92, summary: '商品一致', correction: '' }) });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('qc', {
    textProvider: 'gemini',
    productImagesBase64s: ['data:image/png;base64,AA==', 'data:image/png;base64,AQ=='],
    whiteImageBase64: 'data:image/png;base64,Ag==',
    generatedImageBase64: 'data:image/png;base64,Aw==',
    taskLabel: '厨房使用场景',
    platform: 'taobao',
  }, { 'x-gemini-key': 'test-gemini-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 200);
  assert.equal(body.pass, true);
  assert.equal(sentBody.input.filter(item => item.type === 'image').length, 4);
  assert.match(sentBody.input[0].text, /前 2 张是用户上传的原始商品证据图/);
  assert.match(sentBody.input[0].text, /原始商品证据图为最高事实依据/);
  assert.match(sentBody.input[0].text, /任何可辨识汉字、字母、数字、序号、01\/06/);
  assert.match(sentBody.input[0].text, /底图完全无字/);
});

test('Qwen endpoint validation rejects non-Aliyun hosts before fetching', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => { calls += 1; throw new Error('unexpected upstream call'); };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'qwen',
    qwenEndpoint: 'https://example.com',
  }, { 'x-qwen-key': 'test-qwen-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 400);
  assert.equal(body.code, 'QWEN_ENDPOINT_INVALID');
  assert.equal(calls, 0);
});

test('Qwen TLS 525 errors name Alibaba and retry before browser fallback', async (t) => {
  const originalFetch = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls += 1;
    return new Response('error code: 525', { status: 525, headers: { 'content-type': 'text/plain' } });
  };
  t.after(() => { globalThis.fetch = originalFetch; });

  const response = await worker.fetch(apiRequest('connection-test', {
    provider: 'qwen',
    qwenTextModel: 'qwen-plus',
    qwenEndpoint: 'https://dashscope-intl.aliyuncs.com',
  }, { 'x-qwen-key': 'test-qwen-key' }), env);
  const body = await response.json();

  assert.equal(response.status, 525);
  assert.equal(body.code, 'QWEN_CHAT_TLS_525');
  assert.match(body.error, /Cloudflare 到阿里云百炼千问/);
  assert.doesNotMatch(body.error, /火山方舟/);
  assert.equal(calls, 3);
});
