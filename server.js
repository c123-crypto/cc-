/**
 * 造图台 - 单文件 Node.js API 服务
 * Node.js >= 18.18；API Key 只从每次请求头读取，不落盘、不写日志。
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = Number(process.env.PORT || 3000);
const MAX_BODY = 40 * 1024 * 1024;
const ARK_CHAT_URL = process.env.ARK_CHAT_URL || 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ARK_IMAGE_URL = process.env.ARK_IMAGE_URL || 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const OPENAI_IMAGE_URL = process.env.OPENAI_IMAGE_URL || 'https://api.openai.com/v1/images/edits';
const DEFAULT_VISION_MODEL = process.env.ARK_VISION_MODEL || 'doubao-seed-2-0-lite-260428';
const DEFAULT_IMAGE_MODEL = process.env.ARK_IMAGE_MODEL || 'doubao-seedream-5-0-260128';
const DEFAULT_OPENAI_IMAGE_MODEL = process.env.OPENAI_IMAGE_MODEL || 'gpt-image-2';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

function requestId(req) {
  const supplied = String(req.headers['x-request-id'] || '').replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  return supplied || crypto.randomBytes(8).toString('hex');
}

function sendJSON(res, status, data, extraHeaders = {}) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    ...CORS_HEADERS,
    ...extraHeaders,
  });
  res.end(body);
}

function sendError(res, status, message, code, id) {
  sendJSON(res, status, { error: message, code: code || 'UNKNOWN', requestId: id || '' });
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    let settled = false;
    req.on('data', chunk => {
      if (settled) return;
      size += chunk.length;
      if (size > MAX_BODY) {
        settled = true;
        reject(new Error('BODY_TOO_LARGE'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on('end', () => { if (!settled) resolve(Buffer.concat(chunks)); });
    req.on('error', error => { if (!settled) reject(error); });
  });
}

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

async function readRemoteJSON(response, service) {
  const raw = await response.text();
  try {
    return JSON.parse(raw);
  } catch {
    const error = new Error(`${service}_FORMAT`);
    error.status = response.status;
    throw error;
  }
}

function remoteErrorMessage(payload) {
  return String(payload?.error?.message || payload?.message || payload?.error || '');
}

function classifyError(error, status = 0) {
  const text = String(error?.message || error || '').toLowerCase();
  if (error?.name === 'AbortError' || text.includes('timeout')) return { status: 504, code: 'GEN_TIMEOUT', message: 'AI处理超时，请稍后重试' };
  if (text.includes('body_too_large')) return { status: 413, code: 'IMAGE_TOO_LARGE', message: '请求图片体积过大，请压缩后重试' };
  if (status === 401 || text.includes('invalid_api_key') || text.includes('authentication')) return { status: 401, code: 'INVALID_KEY', message: 'API Key无效或已过期' };
  if (status === 403 || text.includes('permission') || text.includes('forbidden')) return { status: 403, code: 'MODEL_FORBIDDEN', message: '当前账户没有开通所需模型权限' };
  if (status === 404 || text.includes('model_not_found')) return { status: 404, code: 'MODEL_NOT_FOUND', message: '模型名称不可用，请检查模型配置' };
  if (status === 429 || text.includes('rate_limit') || text.includes('frequency')) return { status: 429, code: 'RATE_LIMIT', message: '请求过于频繁，请稍后重试' };
  if (status === 402 || text.includes('insufficient_quota') || text.includes('balance') || text.includes('quota')) return { status: 402, code: 'NO_QUOTA', message: '账户余额或生成额度不足' };
  return { status: status >= 400 && status < 600 ? status : 502, code: 'UPSTREAM_FAILED', message: 'AI服务暂时未完成请求，请稍后重试' };
}

function parseJSONBody(body) {
  try { return JSON.parse(body.toString('utf8')); }
  catch { throw new Error('BAD_JSON'); }
}

function extractJSONObject(text) {
  const cleaned = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('MODEL_JSON_INVALID');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function chatMessageText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(item => typeof item === 'string' ? item : item?.text || item?.content || '').join('\n');
}

function normalizeDataImage(value, fallbackMime = 'image/jpeg') {
  if (typeof value !== 'string' || !value.trim()) throw new Error('IMAGE_MISSING');
  if (value.startsWith('data:image/') || value.startsWith('https://')) return value;
  return `data:${fallbackMime};base64,${value}`;
}

async function imageResponseToDataURI(payload) {
  const item = payload?.data?.[0];
  if (item?.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
  if (item?.url && /^https:\/\//.test(item.url)) {
    const response = await fetchWithTimeout(item.url, { method: 'GET' }, 60000);
    if (!response.ok) throw new Error('IMAGE_DOWNLOAD_FAILED');
    const mime = response.headers.get('content-type') || 'image/jpeg';
    const bytes = Buffer.from(await response.arrayBuffer());
    if (!bytes.length) throw new Error('IMAGE_EMPTY');
    return `data:${mime};base64,${bytes.toString('base64')}`;
  }
  throw new Error('IMAGE_EMPTY');
}

async function imageInputToBlob(image) {
  if (/^https:\/\//.test(image)) {
    const response = await fetchWithTimeout(image, { method: 'GET' }, 60000);
    if (!response.ok) throw new Error('REFERENCE_IMAGE_DOWNLOAD_FAILED');
    return { blob: new Blob([await response.arrayBuffer()], { type: response.headers.get('content-type') || 'image/jpeg' }), mime: response.headers.get('content-type') || 'image/jpeg' };
  }
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) throw new Error('REFERENCE_IMAGE_INVALID');
  return { blob: new Blob([Buffer.from(match[2], 'base64')], { type: match[1] }), mime: match[1] };
}

const PLATFORM_RULES = {
  taobao: '淘宝：真实精致、自然生活感、柔和商业布光、中等信息密度和适度留白；商品占画面约55%至72%；避免廉价促销感、过度锐化和堆砌道具。',
  pdd: '拼多多：优先手机端小图识别；商品占画面约70%至85%，轮廓和明暗对比直接；每张只表达一个卖点，道具少；禁止生成价格、折扣和促销角标。',
  '1688': '1688：面向采购判断，采用中性、标准化、专业目录式布光；突出真实结构、材质、工艺、接口、包装和尺度感；不得虚构规格、起订量、认证或供应能力。',
};

const DIRECTION_RULES = {
  standard: '标准转化：均衡真实展示、使用理解、质量证明、尺度判断和转化构图。',
  scene: '生活场景：强化真实使用关系和自然生活氛围，道具必须克制且符合商品用途。',
  detail: '材质细节：强化纹理、边缘、接口和表面做工，不得虚构内部结构或不可确认的材质。',
  procurement: '采购展示：强化标准化展示、结构、包装和采购信息留白，不得编造参数与认证。',
};

const SERIES_ROLES = {
  square: ['核心卖点场景', '材质做工细节', '尺寸使用感知', '转化留白构图'],
  vertical: ['首屏卖点概览', '核心结构功能', '材质工艺证明', '尺寸适配说明', '使用场景收尾'],
  full: ['核心卖点场景', '材质做工细节', '尺寸使用感知', '转化留白构图', '首屏卖点概览', '核心结构功能', '材质工艺证明', '尺寸适配说明', '使用场景收尾'],
};

async function handleAnalyze(req, res, body, id) {
  const arkKey = String(req.headers['x-ark-key'] || '').trim();
  if (!arkKey) return sendError(res, 400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  let input;
  try { input = parseJSONBody(body); }
  catch { return sendError(res, 400, '请求格式错误', 'BAD_JSON', id); }
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const suiteType = ['square', 'vertical', 'full'].includes(input.suiteType) ? input.suiteType : 'square';
  const direction = ['standard', 'scene', 'detail', 'procurement'].includes(input.direction) ? input.direction : 'standard';
  if (!input.imageBase64) return sendError(res, 400, '缺少商品图片', 'IMAGE_REQUIRED', id);
  const roles = SERIES_ROLES[suiteType];
  const roleLines = roles.map((role, index) => `${index + 1}. ${role}`).join('\n');
  const prompt = `你是中国大陆电商百货商品视觉策划师和图像模型提示词专家。先识别参考图里的真实商品，再制定一套保真、可执行、彼此不重复的电商图片方案。\n\n目标平台策略：${PLATFORM_RULES[platform]}\n套图方向：${DIRECTION_RULES[direction]}\n用户补充：${String(input.userNote || '无').slice(0, 120)}\n\n白底首图由 white_prompt 单独生成，不要把白底图重复放进 series。series 必须正好${roles.length}项，顺序和 label 固定为：\n${roleLines}\n\n只输出合法JSON，不要Markdown：\n{"product_summary":"商品类型、形状、颜色、材质、数量、包装与可见标识的中文摘要","white_prompt":"豆包Seedream白底修图提示词","series":[{"label":"固定任务名称","prompt":"给图片模型的完整中文提示词"}]}\n\n每条图片提示词必须明确：唯一画面目标、商品主体占比、镜头角度、构图、真实场景、灯光、道具数量、留白位置和禁止项。每张只解决一个问题，不能换词重复。必须以参考商品为唯一依据，保持形状、比例、颜色、材质、包装结构、标签原文、商标位置和配件数量；不重新设计，不增减功能，不复制商品，不遮挡主体，不虚构使用效果。画面内禁止新增文字、价格、促销角标、Logo、店铺名、二维码、联系方式、水印、边框、乱码、认证、比较元素和绝对化宣传。不得暗示未经证实的医疗、安全、环保、质量、销量或官方背书。`;

  try {
    const response = await fetchWithTimeout(ARK_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
      body: JSON.stringify({
        model: input.visionModel || DEFAULT_VISION_MODEL,
        messages: [{ role: 'user', content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: normalizeDataImage(input.imageBase64) } },
        ] }],
        temperature: 0.25,
        max_tokens: suiteType === 'full' ? 4600 : 3000,
        response_format: { type: 'json_object' },
      }),
    }, 90000);
    const payload = await readRemoteJSON(response, 'ARK_CHAT');
    if (!response.ok) {
      const mapped = classifyError(remoteErrorMessage(payload), response.status);
      return sendError(res, mapped.status, mapped.message, mapped.code, id);
    }
    const raw = extractJSONObject(chatMessageText(payload.choices?.[0]?.message?.content));
    const series = Array.isArray(raw.series) ? raw.series.slice(0, roles.length).map((item, index) => ({
      label: roles[index],
      prompt: String(item?.prompt || '').trim().slice(0, 7000),
    })) : [];
    if (series.length !== roles.length || series.some(item => !item.prompt)) return sendError(res, 502, '提示词方案数量不完整，请重新生成', 'PROMPT_PLAN_INCOMPLETE', id);
    sendJSON(res, 200, {
      product_summary: String(raw.product_summary || '已识别商品主体与外观特征').trim().slice(0, 240),
      white_prompt: String(raw.white_prompt || '只替换为纯白背景，严格保持商品外观、数量、标签和配件，商品完整居中，轻微自然接触阴影，不生成额外文字、Logo或水印。').trim().slice(0, 5000),
      series,
      roles,
    });
  } catch (error) {
    const mapped = classifyError(error);
    sendError(res, mapped.status, mapped.message, mapped.code, id);
  }
}

async function generateSeedream(arkKey, image, prompt, imageModel, aspect) {
  const aspectRule = aspect === 'vertical' ? '2:3竖版详情页构图' : '1:1正方形商品图构图';
  const response = await fetchWithTimeout(ARK_IMAGE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({
      model: imageModel || DEFAULT_IMAGE_MODEL,
      prompt: `${prompt}\n输出要求：${aspectRule}；只生成一张完整图片；严格保持参考商品结构、颜色、数量、包装文字和标识位置；禁止新增文字、价格、Logo、水印和边框。`,
      image: normalizeDataImage(image),
      size: '2K',
      response_format: 'url',
      watermark: false,
    }),
  }, 180000);
  const payload = await readRemoteJSON(response, 'ARK_IMAGE');
  if (!response.ok) {
    const message = remoteErrorMessage(payload);
    const mapped = classifyError(message, response.status);
    const error = new Error(mapped.code);
    error.userMessage = mapped.message;
    error.status = mapped.status;
    throw error;
  }
  return imageResponseToDataURI(payload);
}

async function generateOpenAI(openaiKey, image, prompt, aspect, model) {
  const { blob, mime } = await imageInputToBlob(normalizeDataImage(image));
  const form = new FormData();
  form.append('model', model || DEFAULT_OPENAI_IMAGE_MODEL);
  form.append('image', blob, `reference.${mime.includes('png') ? 'png' : 'jpg'}`);
  form.append('prompt', prompt);
  form.append('size', aspect === 'vertical' ? '1024x1536' : '1024x1024');
  form.append('quality', 'medium');
  form.append('output_format', 'jpeg');
  form.append('output_compression', '88');
  form.append('background', 'opaque');
  const response = await fetchWithTimeout(OPENAI_IMAGE_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}` },
    body: form,
  }, 210000);
  const payload = await readRemoteJSON(response, 'OPENAI_IMAGE');
  if (!response.ok) {
    const mapped = classifyError(remoteErrorMessage(payload), response.status);
    const error = new Error(mapped.code);
    error.userMessage = mapped.message;
    error.status = mapped.status;
    throw error;
  }
  return imageResponseToDataURI(payload);
}

async function handleWhiteImage(req, res, body, id) {
  const arkKey = String(req.headers['x-ark-key'] || '').trim();
  if (!arkKey) return sendError(res, 400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  let input;
  try { input = parseJSONBody(body); }
  catch { return sendError(res, 400, '请求格式错误', 'BAD_JSON', id); }
  if (!input.prompt || !input.imageBase64) return sendError(res, 400, '缺少白底提示词或商品图片', 'WHITE_INPUT_REQUIRED', id);
  try {
    const image = await generateSeedream(arkKey, input.imageBase64, input.prompt, input.imageModel, 'square');
    sendJSON(res, 200, { image, model: 'doubao-seedream', isBaseImage: true });
  } catch (error) {
    sendError(res, error.status || 502, error.userMessage || '豆包白底图暂时未完成', error.message || 'WHITE_IMAGE_FAILED', id);
  }
}

async function handleSeriesImage(req, res, body, id) {
  const arkKey = String(req.headers['x-ark-key'] || '').trim();
  const openaiKey = String(req.headers['x-openai-key'] || '').trim();
  if (!arkKey) return sendError(res, 400, '请先填写火山方舟 API Key，作为图片生成和备用引擎', 'ARK_KEY_REQUIRED', id);
  let input;
  try { input = parseJSONBody(body); }
  catch { return sendError(res, 400, '请求格式错误', 'BAD_JSON', id); }
  if (!input.prompt || !input.whiteImageBase64) return sendError(res, 400, '缺少提示词或白底参考图', 'SERIES_INPUT_REQUIRED', id);
  const aspect = input.aspect === 'vertical' ? 'vertical' : 'square';
  let openaiFailure = '';
  if (openaiKey) {
    try {
      const image = await generateOpenAI(openaiKey, input.whiteImageBase64, input.prompt, aspect, input.openaiImageModel);
      return sendJSON(res, 200, { image, model: 'openai', provider: 'openai', fallback: false });
    } catch (error) {
      openaiFailure = error.userMessage || 'OpenAI未完成本次生成';
    }
  }
  try {
    const image = await generateSeedream(arkKey, input.whiteImageBase64, input.prompt, input.imageModel, aspect);
    return sendJSON(res, 200, { image, model: 'doubao-seedream', provider: 'doubao', fallback: Boolean(openaiKey), openaiFailure });
  } catch (error) {
    return sendError(res, error.status || 502, openaiKey ? `OpenAI与豆包均未完成：${error.userMessage || '请稍后重试'}` : error.userMessage || '豆包暂时未完成生成', 'ALL_MODELS_FAILED', id);
  }
}

async function handleQC(req, res, body, id) {
  const arkKey = String(req.headers['x-ark-key'] || '').trim();
  if (!arkKey) return sendError(res, 400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  let input;
  try { input = parseJSONBody(body); }
  catch { return sendError(res, 400, '请求格式错误', 'BAD_JSON', id); }
  if (!input.whiteImageBase64 || !input.generatedImageBase64) return sendError(res, 400, '缺少质检对比图片', 'QC_IMAGES_REQUIRED', id);
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const qcPrompt = `你是中国大陆电商商品图质检员。第1张图是商品白底基准图，第2张图是待检生成图。任务：${String(input.taskLabel || '商品图').slice(0, 40)}。平台要求：${PLATFORM_RULES[platform]}\n\n严格检查：商品形状、比例、颜色、材质、包装结构、标签与商标位置、配件数量是否一致；是否出现复制、增减结构、错误使用、畸形手部；是否出现乱码、新文字、价格、折扣、二维码、水印、其他品牌Logo、认证或绝对化宣传；商品是否清晰完整、无遮挡并符合任务。\n\n只输出合法JSON：{"pass":true,"score":0到100整数,"summary":"不超过40字中文结论","correction":"不通过时给图片模型的不超过180字精准修改要求，通过则为空"}。只有评分不低于80且没有商品失真或违规文字时才能通过。`;
  try {
    const response = await fetchWithTimeout(ARK_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
      body: JSON.stringify({
        model: input.visionModel || DEFAULT_VISION_MODEL,
        messages: [{ role: 'user', content: [
          { type: 'text', text: qcPrompt },
          { type: 'image_url', image_url: { url: normalizeDataImage(input.whiteImageBase64) } },
          { type: 'image_url', image_url: { url: normalizeDataImage(input.generatedImageBase64) } },
        ] }],
        temperature: 0.1,
        max_tokens: 800,
        response_format: { type: 'json_object' },
      }),
    }, 90000);
    const payload = await readRemoteJSON(response, 'ARK_QC');
    if (!response.ok) {
      const mapped = classifyError(remoteErrorMessage(payload), response.status);
      return sendError(res, mapped.status, '自动质检暂时无法完成', mapped.code, id);
    }
    const raw = extractJSONObject(chatMessageText(payload.choices?.[0]?.message?.content));
    const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || 0)));
    const passed = raw.pass === true && score >= 80;
    sendJSON(res, 200, {
      pass: passed,
      score,
      summary: String(raw.summary || (passed ? '商品一致性与画面质量通过' : '发现需要修正的问题')).slice(0, 80),
      correction: passed ? '' : String(raw.correction || raw.summary || '严格恢复商品真实结构并移除错误元素').slice(0, 300),
    });
  } catch (error) {
    const mapped = classifyError(error);
    sendError(res, mapped.status, '自动质检暂时无法完成', 'QC_FAILED', id);
  }
}

function serveFile(res, filePath, contentType) {
  try {
    const data = fs.readFileSync(filePath);
    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': data.length,
      'Cache-Control': contentType.includes('html') ? 'no-cache' : 'public, max-age=86400',
      'X-Content-Type-Options': 'nosniff',
      ...CORS_HEADERS,
    });
    res.end(data);
  } catch {
    sendError(res, 404, '文件不存在', 'NOT_FOUND');
  }
}

const server = http.createServer(async (req, res) => {
  const id = requestId(req);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJSON(res, 200, { status: 'ok', version: '2.0.0', time: new Date().toISOString() });
  }
  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    return serveFile(res, path.join(__dirname, 'public', 'index.html'), 'text/html; charset=utf-8');
  }
  if (req.method === 'GET' && url.pathname === '/vendor/jszip.min.js') {
    return serveFile(res, path.join(__dirname, 'node_modules', 'jszip', 'dist', 'jszip.min.js'), 'application/javascript; charset=utf-8');
  }
  if (req.method !== 'POST') return sendError(res, 405, '请求方法不允许', 'METHOD_NOT_ALLOWED', id);
  try {
    const body = await readBody(req);
    if (url.pathname === '/api/analyze') return await handleAnalyze(req, res, body, id);
    if (url.pathname === '/api/white-image') return await handleWhiteImage(req, res, body, id);
    if (url.pathname === '/api/series-image') return await handleSeriesImage(req, res, body, id);
    if (url.pathname === '/api/qc') return await handleQC(req, res, body, id);
    return sendError(res, 404, '接口不存在', 'NOT_FOUND', id);
  } catch (error) {
    const mapped = classifyError(error);
    return sendError(res, mapped.status, mapped.message, mapped.code, id);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`造图台已启动：http://0.0.0.0:${PORT}`);
});
