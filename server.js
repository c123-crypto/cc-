/**
 * AI商品图片工作台 - 后端API服务
 * 代理火山方舟(豆包)和OpenAI的API调用，密钥通过请求头临时接收
 */
const http = require('http');
const https = require('https');
const { URL } = require('url');
const StringDecoder = require('string_decoder').StringDecoder;
const FormData = require('form-data');

const PORT = process.env.PORT || 3000;
const MAX_BODY = 12 * 1024 * 1024; // 12MB上限（图片base64会膨胀）

// 火山方舟API端点
const ARK_CHAT_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ARK_IMAGE_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const ARK_IMAGE_EDIT_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/edits';

// OpenAI API端点
const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';
const OPENAI_IMAGE_EDIT_URL = 'https://api.openai.com/v1/images/edits';

// CORS头
const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Request-Id',
  'Access-Control-Max-Age': '86400',
};

function sendJSON(res, code, data, extraHeaders) {
  const body = JSON.stringify(data);
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    ...CORS_HEADERS,
    ...(extraHeaders || {}),
  };
  res.writeHead(code, headers);
  res.end(body);
}

function sendError(res, code, message, detail) {
  sendJSON(res, code, { error: message, detail: detail || '' });
}

// 读取请求体
function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', chunk => {
      size += chunk.length;
      if (size > MAX_BODY) { reject(new Error('BODY_TOO_LARGE')); req.destroy(); return; }
      chunks.push(chunk);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// 通用HTTPS请求
function httpsRequest(url, options, body) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const opts = {
      hostname: u.hostname,
      port: 443,
      path: u.pathname + u.search,
      method: options.method || 'POST',
      headers: { ...options.headers, Host: u.hostname },
      timeout: 120000,
    };
    const req = https.request(opts, res => {
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        resolve({ status: res.statusCode, headers: res.headers, body: buf });
      });
    });
    req.on('timeout', () => { req.destroy(); reject(new Error('REQUEST_TIMEOUT')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

// 解析错误码
function classifyError(err, status) {
  const msg = (err.message || err || '').toLowerCase();
  if (msg.includes('timeout') || msg.includes('request_timeout')) return { code: 'GEN_TIMEOUT', message: '图片生成超时，请重试' };
  if (status === 401 || msg.includes('invalid_api_key') || msg.includes('authentication')) return { code: 'INVALID_KEY', message: 'API Key无效或已过期' };
  if (status === 403 || msg.includes('permission') || msg.includes('forbidden')) return { code: 'MODEL_FORBIDDEN', message: '模型未开通或无权限' };
  if (status === 429 || msg.includes('rate_limit') || msg.includes('frequency')) return { code: 'RATE_LIMIT', message: '请求频率过高，请稍后重试' };
  if (status === 402 || msg.includes('insufficient_quota') || msg.includes('balance') || msg.includes('quota')) return { code: 'NO_QUOTA', message: '账户额度不足' };
  if (msg.includes('body_too_large')) return { code: 'IMAGE_TOO_LARGE', message: '图片超过8MB限制' };
  return { code: 'UNKNOWN', message: '请求失败：' + (err.message || err || '未知错误') };
}

/* ============ API路由 ============ */

// 1. 商品理解 - 调用火山方舟视觉模型
async function handleAnalyze(req, res, body) {
  const arkKey = req.headers['x-ark-key'];
  if (!arkKey) return sendError(res, 400, '缺少火山方舟API Key');

  let parsed;
  try { parsed = JSON.parse(body.toString()); } catch(e) { return sendError(res, 400, '请求格式错误'); }

  const { imageBase64, platform, suiteType, direction, userNote } = parsed;
  if (!imageBase64) return sendError(res, 400, '缺少商品图片');
  if (!platform) return sendError(res, 400, '缺少平台选择');

  // 构建视觉理解提示词
  const platformStrategy = {
    taobao: '精致、真实、自然生活感、柔和布光、适度留白，商品占画面55%至72%，避免廉价促销感',
    pdd: '适合手机端缩略图，商品占画面70%至85%，轮廓醒目、对比直接，每张图只表达一个卖点',
    '1688': '专业目录式布光，突出结构、材质、工艺、接口、包装和尺度感，减少生活化装饰'
  };

  const suiteDef = suiteType === 'square' ? [
    '1. 白底商品主图', '2. 核心卖点场景', '3. 材质做工细节', '4. 尺寸使用感知', '5. 转化留白构图'
  ] : suiteType === 'vertical' ? [
    '1. 首屏卖点概览', '2. 核心结构功能', '3. 材质工艺证明', '4. 尺寸适配说明', '5. 使用场景收尾'
  ] : [
    '1. 白底商品主图', '2. 核心卖点场景', '3. 材质做工细节', '4. 尺寸使用感知', '5. 转化留白构图',
    '6. 首屏卖点概览', '7. 核心结构功能', '8. 材质工艺证明', '9. 尺寸适配说明', '10. 使用场景收尾'
  ];

  const sysPrompt = `你是一个专业的电商商品摄影指导和AI图片生成提示词专家。
请分析用户上传的商品实拍图，生成一整套可用于${platform}平台的商品图片提示词。

平台视觉策略：${platformStrategy[platform] || platformStrategy.taobao}
套图方向：${direction || '标准转化套图'}
用户补充要求：${userNote || '无'}

需要生成的图片任务列表：
${suiteDef.join('\n')}

请输出严格JSON格式（不要markdown代码块），结构如下：
{
  "product_summary": "商品识别摘要（中文，描述商品类型、外观、材质、颜色等）",
  "white_prompt": "白底图提示词（中文，描述如何生成纯白背景商品主图）",
  "series": [
    {
      "label": "图片任务名称",
      "prompt": "完整图片生成提示词（中文，必须明确描述：商品真实外观、画面用途、主体占比、镜头角度、背景与场景、灯光、道具数量、构图留白、禁止生成的内容）"
    }
  ]
}

规则：
- 每张图只解决一个主要问题，不能内容重复
- 不生成价格、折扣、二维码、联系方式或水印
- 不生成其他品牌标识
- 保持商品形状、比例、颜色、材质和结构一致
- 不增减商品和配件`;

  const reqBody = JSON.stringify({
    model: parsed.visionModel || 'doubao-1.5-vision-pro-32k-250115',
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: [
        { type: 'image_url', image_url: { url: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}` } },
        { type: 'text', text: '请分析这张商品图片并生成提示词JSON。' }
      ]}
    ],
    temperature: 0.3,
    response_format: { type: 'json_object' },
  });

  try {
    const resp = await httpsRequest(ARK_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${arkKey}` },
    }, reqBody);

    const text = resp.body.toString();
    if (resp.status !== 200) {
      const errInfo = classifyError(text, resp.status);
      return sendError(res, resp.status, errInfo.message, errInfo.code);
    }

    let json;
    try { json = JSON.parse(text); } catch(e) { return sendError(res, 502, '模型返回格式异常'); }

    const content = json.choices?.[0]?.message?.content;
    if (!content) return sendError(res, 502, '模型未返回内容');

    // 尝试解析JSON（可能包裹在markdown代码块中）
    let result;
    try {
      result = JSON.parse(content);
    } catch(e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { result = JSON.parse(match[0]); } catch(e2) {
          return sendError(res, 502, '模型返回的JSON无法解析');
        }
      } else {
        return sendError(res, 502, '模型未返回有效JSON');
      }
    }

    sendJSON(res, 200, result);
  } catch(err) {
    const errInfo = classifyError(err, 0);
    sendError(res, 500, errInfo.message, errInfo.code);
  }
}

// 2. 白底图生成 - 豆包Seedream
async function handleWhiteImage(req, res, body) {
  const arkKey = req.headers['x-ark-key'];
  if (!arkKey) return sendError(res, 400, '缺少火山方舟API Key');

  let parsed;
  try { parsed = JSON.parse(body.toString()); } catch(e) { return sendError(res, 400, '请求格式错误'); }

  const { prompt, imageBase64, model } = parsed;
  if (!prompt || !imageBase64) return sendError(res, 400, '缺少提示词或图片');

  const reqBody = JSON.stringify({
    model: model || 'doubao-seedream-3-0-t2i-250415',
    prompt,
    image: imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`,
    response_format: 'b64_json',
    size: '1024x1024',
  });

  try {
    const resp = await httpsRequest(ARK_IMAGE_EDIT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${arkKey}` },
    }, reqBody);

    const text = resp.body.toString();
    if (resp.status !== 200) {
      const errInfo = classifyError(text, resp.status);
      return sendError(res, resp.status, errInfo.message, errInfo.code);
    }

    let json;
    try { json = JSON.parse(text); } catch(e) { return sendError(res, 502, '图片生成返回格式异常'); }

    const b64 = json.data?.[0]?.b64_json;
    if (!b64) return sendError(res, 502, '图片生成未返回数据');

    sendJSON(res, 200, { image: `data:image/png;base64,${b64}`, model: 'seedream' });
  } catch(err) {
    const errInfo = classifyError(err, 0);
    sendError(res, 500, errInfo.message, errInfo.code);
  }
}

// 3. 系列图生成 - 优先OpenAI，失败切豆包
async function handleSeriesImage(req, res, body) {
  const arkKey = req.headers['x-ark-key'];
  const openaiKey = req.headers['x-openai-key'];
  if (!arkKey && !openaiKey) return sendError(res, 400, '缺少API Key');

  let parsed;
  try { parsed = JSON.parse(body.toString()); } catch(e) { return sendError(res, 400, '请求格式错误'); }

  const { prompt, whiteImageBase64, model } = parsed;
  if (!prompt || !whiteImageBase64) return sendError(res, 400, '缺少提示词或白底参考图');

  let usedModel = '';
  let imageB64 = '';

  // 优先尝试OpenAI
  if (openaiKey) {
    try {
      const formData = new FormData();
      // 从data URI提取纯base64
      const base64Data = whiteImageBase64.startsWith('data:')
        ? whiteImageBase64.split(',')[1]
        : whiteImageBase64;
      const imgBuffer = Buffer.from(base64Data, 'base64');

      formData.append('image', imgBuffer, { filename: 'reference.png', contentType: 'image/png' });
      formData.append('prompt', prompt);
      formData.append('size', '1024x1024');
      formData.append('response_format', 'b64_json');
      formData.append('n', '1');

      const formHeaders = formData.getHeaders();
      const formBuffer = formData.getBuffer();

      const resp = await httpsRequest('https://api.openai.com/v1/images/edits', {
        method: 'POST',
        headers: {
          ...formHeaders,
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Length': formBuffer.length,
        },
      }, formBuffer);

      if (resp.status === 200) {
        const json = JSON.parse(resp.body.toString());
        if (json.data?.[0]?.b64_json) {
          imageB64 = json.data[0].b64_json;
          usedModel = 'openai';
        }
      }
    } catch(err) {
      console.error('OpenAI failed:', err.message);
      // 继续走豆包
    }
  }

  // OpenAI失败或未配置，使用豆包Seedream
  if (!imageB64 && arkKey) {
    try {
      const reqBody = JSON.stringify({
        model: model || 'doubao-seedream-3-0-t2i-250415',
        prompt,
        image: whiteImageBase64.startsWith('data:') ? whiteImageBase64 : `data:image/jpeg;base64,${whiteImageBase64}`,
        response_format: 'b64_json',
        size: '1024x1024',
      });

      const resp = await httpsRequest(ARK_IMAGE_EDIT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${arkKey}` },
      }, reqBody);

      if (resp.status === 200) {
        const json = JSON.parse(resp.body.toString());
        if (json.data?.[0]?.b64_json) {
          imageB64 = json.data[0].b64_json;
          usedModel = usedModel ? usedModel + '+seedream_fallback' : 'seedream';
        }
      } else {
        const errInfo = classifyError(resp.body.toString(), resp.status);
        return sendError(res, resp.status, errInfo.message, errInfo.code);
      }
    } catch(err) {
      const errInfo = classifyError(err, 0);
      return sendError(res, 500, errInfo.message, errInfo.code);
    }
  }

  if (!imageB64) {
    return sendError(res, 500, '两个图片模型均失败', 'ALL_MODELS_FAILED');
  }

  sendJSON(res, 200, {
    image: `data:image/png;base64,${imageB64}`,
    model: usedModel,
    openai_attempted: !!openaiKey,
  });
}

// 4. 质检 - 视觉模型对比
async function handleQC(req, res, body) {
  const arkKey = req.headers['x-ark-key'];
  if (!arkKey) return sendError(res, 400, '缺少火山方舟API Key');

  let parsed;
  try { parsed = JSON.parse(body.toString()); } catch(e) { return sendError(res, 400, '请求格式错误'); }

  const { whiteImageBase64, generatedImageBase64, taskLabel, platform } = parsed;
  if (!whiteImageBase64 || !generatedImageBase64) return sendError(res, 400, '缺少对比图片');

  const platformRule = {
    taobao: '精致、真实、自然生活感，商品占55%-72%',
    pdd: '商品占70%-85%，轮廓醒目，适合手机缩略图',
    '1688': '专业目录式，突出结构和材质'
  };

  const sysPrompt = `你是电商图片质检专家。请对比白底基准图和生成的商品图，严格检查以下各项：

1. 商品形状是否一致
2. 比例和颜色是否一致
3. 材质和包装结构是否一致
4. 商品数量和配件是否改变
5. 是否凭空增加结构
6. 是否出现商品变形或畸形
7. 是否出现乱码、价格、折扣、二维码或水印
8. 是否出现其他品牌Logo
9. 是否符合${platform}平台要求：${platformRule[platform] || ''}
10. 是否符合图片任务：${taskLabel || ''}
11. 是否达到正常电商商业摄影质量

输出严格JSON：
{
  "pass": true或false,
  "score": 0到100的整数,
  "summary": "中文质检结论",
  "correction": "不通过时的修改要求（通过时留空）"
}

通过条件：评分不低于80，且不存在商品失真或违规文字。`;

  const reqBody = JSON.stringify({
    model: parsed.visionModel || 'doubao-1.5-vision-pro-32k-250115',
    messages: [
      { role: 'system', content: sysPrompt },
      { role: 'user', content: [
        { type: 'text', text: '白底基准图：' },
        { type: 'image_url', image_url: { url: whiteImageBase64.startsWith('data:') ? whiteImageBase64 : `data:image/jpeg;base64,${whiteImageBase64}` } },
        { type: 'text', text: '生成的图片：' },
        { type: 'image_url', image_url: { url: generatedImageBase64.startsWith('data:') ? generatedImageBase64 : `data:image/jpeg;base64,${generatedImageBase64}` } },
        { type: 'text', text: '请进行质检并输出JSON。' }
      ]}
    ],
    temperature: 0.2,
    response_format: { type: 'json_object' },
  });

  try {
    const resp = await httpsRequest(ARK_CHAT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${arkKey}` },
    }, reqBody);

    if (resp.status !== 200) {
      return sendError(res, 502, '质检暂时无法完成', 'QC_FAILED');
    }

    const json = JSON.parse(resp.body.toString());
    const content = json.choices?.[0]?.message?.content;
    if (!content) return sendError(res, 502, '质检未返回内容');

    let result;
    try { result = JSON.parse(content); }
    catch(e) {
      const match = content.match(/\{[\s\S]*\}/);
      if (match) { try { result = JSON.parse(match[0]); } catch(e2) { return sendError(res, 502, '质检返回JSON无法解析'); } }
      else return sendError(res, 502, '质检返回格式异常');
    }

    sendJSON(res, 200, result);
  } catch(err) {
    sendError(res, 500, '质检暂时无法完成', err.message);
  }
}

/* ============ HTTP Server ============ */
const server = http.createServer(async (req, res) => {
  // CORS预检
  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS_HEADERS);
    return res.end();
  }

  const url = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === 'GET' && url.pathname === '/health') {
    return sendJSON(res, 200, { status: 'ok', time: new Date().toISOString() });
  }

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    // 返回前端页面
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, 'public', 'index.html');
    try {
      const html = fs.readFileSync(filePath, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...CORS_HEADERS });
      return res.end(html);
    } catch(e) {
      return sendError(res, 404, '前端页面未找到');
    }
  }

  if (req.method !== 'POST') {
    return sendError(res, 405, '方法不允许');
  }

  try {
    const body = await readBody(req);

    switch(url.pathname) {
      case '/api/analyze': return await handleAnalyze(req, res, body);
      case '/api/white-image': return await handleWhiteImage(req, res, body);
      case '/api/series-image': return await handleSeriesImage(req, res, body);
      case '/api/qc': return await handleQC(req, res, body);
      default: return sendError(res, 404, '接口不存在');
    }
  } catch(err) {
    if (err.message === 'BODY_TOO_LARGE') return sendError(res, 413, '图片超过8MB限制', 'IMAGE_TOO_LARGE');
    sendError(res, 500, '服务器错误', err.message);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`AI商品图片工作台服务已启动: http://0.0.0.0:${PORT}`);
});
