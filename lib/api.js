const MAX_BODY = 40 * 1024 * 1024;
const ARK_CHAT_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ARK_IMAGE_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/edits';
const DEFAULT_VISION_MODEL = 'doubao-seed-2-0-lite-260428';
const DEFAULT_IMAGE_MODEL = 'doubao-seedream-5-0-260128';
const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';

const IMAGE_TOOLS = {
  'aplus-page': '生成高转化电商A+详情页视觉，突出商品结构、卖点分区、材质细节与使用场景，保留安全的中文信息留白区，不生成乱码文字。',
  'viral-remake': '参考用户描述重做爆款视觉语言，借鉴构图、色彩、光线和节奏，但不得复制第三方商标、人物或受版权保护的独特元素。',
  'batch-suite': '为商品生成统一品牌调性的商业套图单页，主体清晰、背景干净、构图适合电商投放。',
  'product-shot': '生成专业棚拍商品图，真实保持商品外观、材质、颜色、包装结构与标识位置。',
  'product-retouch': '精修商品实拍图：去除灰尘、划痕与杂乱反光，校正白平衡并提升清晰度，不能改变商品结构。',
  'amazon-suite': '生成符合亚马逊商品页视觉习惯的专业商品图：主体清晰、信息层级明确、不得添加价格、评分或虚假认证。',
  'taobao-suite': '生成符合淘宝电商视觉习惯的商品套图单页：真实精致、自然生活感、主体清晰并保留适度信息留白。',
  'amazon-aplus': '生成亚马逊A+品牌内容视觉，包含品牌故事感、功能分区、细节特写和场景化展示，保留文案排版空间。',
  'detail-remake': '参考用户描述重做高转化详情页视觉语言，借鉴信息层级、构图、配色与节奏，但不得复制第三方品牌或受版权保护的独特设计。',
  'background-swap': '只替换商品背景，严格保持商品主体、包装文字、商标位置、形状、比例、颜色和数量不变。',
  'subject-replace': '用用户提供或描述的新商品主体替换原主体，保持原场景的构图、透视、光线、阴影和商业质感自然一致。',
  'product-recolor': '只改变商品指定区域的颜色，保持结构、材质、纹理、文字、Logo位置、光影和背景不变。',
  'image-text-edit': '只替换用户指定的画面文字，保持原字体风格、字号层级、排版、颜色、背景纹理和其他元素不变，禁止乱码。',
  'wearing-suite': '生成统一风格的穿戴展示套图，保持服装或配饰版型、图案、材质和颜色，人物姿态自然。',
  'ai-model': '将服装或配饰自然展示在真实商业模特身上，保持商品版型、纹理、图案、颜色和细节不变。',
  'virtual-tryon': '完成自然试穿合成，服装贴合人体姿态，保留原始版型、长度、图案和材质，不改变人物身份特征。',
  'portrait-background': '仅替换人像背景，保持人物面部、发型、肤色、体态、服装和边缘细节自然真实。',
  'dewrinkle': '去除服装褶皱并恢复平整面料质感，保持剪裁、轮廓、缝线、图案、纽扣和颜色不变。',
  'recolor': '只改变指定服装颜色，保持人物、光影、材质纹理、版型和其他元素不变。',
  'shoe-tryon': '将鞋子自然合成到人物脚部，保持鞋型、材质、配色和Logo位置，透视、遮挡与阴影真实。',
  'image-edit': '按用户要求进行专业图片编辑，保持未指定区域不变，边缘、光影与透视自然。',
  'cutout': '精准抠出主体，移除原背景并输出干净透明背景效果，保留毛发、半透明材质和细小边缘。',
  'erase': '移除用户指定元素，并依据周围纹理、结构、光影和透视自然补全背景。',
  'enhance': '提升清晰度、细节、降噪与色彩层次，避免过度锐化，不改变人物身份、文字内容和物体结构。',
  'translate-image': '将画面内可识别文字替换为用户指定语言，保持原排版、字号层级、颜色和整体设计，禁止乱码。',
  'face-swap': '在已获授权的素材中完成自然人脸替换，保持目标人物姿态、发型、服装、光影和背景不变，不生成公众人物或误导性身份内容。',
  'watermark-remove': '仅处理用户拥有或已获授权的图片，移除用户指定的自有水印并自然修复背景，不移除版权归属或来源标识。',
  'logo-swap': '仅处理用户自有品牌素材，替换指定Logo并保持原画面透视、材质、光影、尺寸与位置自然一致。',
  'seal-extract': '仅从用户有权处理的文件中提取指定的自有印章图形，清理背景并保留真实边缘，不生成、修改或仿造印章内容。',
  'poster-text-replace': '替换海报中用户指定的文字，保持原有版式、字体气质、颜色、层级、纹理和视觉平衡，禁止乱码。',
  'batch-process': '按用户要求完成统一的批量图片处理，保持各图片主体真实且风格一致。',
  'resize': '在不裁掉主体的前提下无损适配目标尺寸，必要时智能扩展背景，保持构图自然。',
  'collage': '将素材整理为结构清晰、留白均衡的商业拼图版式，避免遮挡核心主体。',
  'outpaint': '向画面边缘自然扩展场景，延续原图光线、透视、纹理和景深，不改变中心主体。',
  'id-photo': '生成规范、自然的证件照效果：正面姿态、均匀布光、干净背景，保持本人五官与身份特征。',
  'ai-logo': '生成简洁、可识别、易缩放的原创品牌标志概念，避免模仿现有品牌，图形与品牌气质一致。',
};

const TEXT_TOOLS = {
  'product-video-script': '你是电商短视频导演。输出可执行的15至30秒商品视频方案，包含镜头序号、时长、画面、运镜、字幕、旁白、音效和转场。',
  'image-video-prompt': '你是图生视频提示词专家。输出一条完整中文视频提示词，包含主体动作、镜头运动、环境变化、光线、节奏、时长与明确禁止项。',
  'sales-video-copy': '你是合规的电商口播编导。输出短视频口播文案、画面提示、字幕节奏和结尾行动指引，不编造功效、销量、认证或价格。',
  'social-design': '你是自媒体视觉策划师。输出封面主题、版式结构、配色、字体层级、素材建议和一条可用于图像模型的完整提示词。',
  'ai-copy': '你是中文品牌文案专家。输出标题、正文、核心卖点、行动引导和可选标签，语言自然，避免绝对化与未经证实的承诺。',
  'ai-poster': '你是商业海报设计师。输出海报主题、信息层级、主视觉、版式、配色、字体、素材与完整生成提示词。',
  'asin-listing': '你是亚马逊Listing优化专家。根据用户提供的ASIN信息与商品资料，输出合规标题、五点描述、产品描述、搜索词建议和需要核实的事实清单；不得假装已联网读取ASIN。',
  'live-ppt': '你是演示文稿策划师。输出逐页PPT大纲，每页包含页标题、核心观点、建议图表或视觉、演讲备注，并给出统一视觉风格。',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Request-Id',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

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

function json(status, data) {
  return Response.json(data, { status, headers: CORS });
}
function failure(status, message, code, requestId = '') {
  return json(status, { error: message, code: code || 'UNKNOWN', requestId });
}
function classify(error, status = 0) {
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
async function timedFetch(url, options, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try { return await fetch(url, { ...options, signal: controller.signal }); }
  finally { clearTimeout(timer); }
}
async function remoteJSON(response, service) {
  const raw = await response.text();
  try { return JSON.parse(raw); }
  catch { const error = new Error(`${service}_FORMAT`); error.status = response.status; throw error; }
}
function remoteMessage(payload) {
  return String(payload?.error?.message || payload?.message || payload?.error || '');
}
function extractObject(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('MODEL_JSON_INVALID');
  return JSON.parse(clean.slice(start, end + 1));
}
function messageText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(item => typeof item === 'string' ? item : item?.text || item?.content || '').join('\n');
}
function normalizeImage(value, fallback = 'image/jpeg') {
  if (typeof value !== 'string' || !value.trim()) throw new Error('IMAGE_MISSING');
  if (value.startsWith('data:image/') || value.startsWith('https://')) return value;
  return `data:${fallback};base64,${value}`;
}
function bytesToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}
function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}
async function imagePayload(payload) {
  const item = payload?.data?.[0];
  if (item?.b64_json) return `data:image/jpeg;base64,${item.b64_json}`;
  if (item?.url && /^https:\/\//.test(item.url)) {
    const response = await timedFetch(item.url, {}, 60000);
    if (!response.ok) throw new Error('IMAGE_DOWNLOAD_FAILED');
    const mime = response.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${bytesToBase64(await response.arrayBuffer())}`;
  }
  throw new Error('IMAGE_EMPTY');
}
async function imageBlob(image) {
  if (/^https:\/\//.test(image)) {
    const response = await timedFetch(image, {}, 60000);
    if (!response.ok) throw new Error('REFERENCE_IMAGE_DOWNLOAD_FAILED');
    const mime = response.headers.get('content-type') || 'image/jpeg';
    return { blob: new Blob([await response.arrayBuffer()], { type: mime }), mime };
  }
  const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) throw new Error('REFERENCE_IMAGE_INVALID');
  return { blob: new Blob([base64ToBytes(match[2])], { type: match[1] }), mime: match[1] };
}
async function parseInput(request) {
  const declared = Number(request.headers.get('content-length') || 0);
  if (declared > MAX_BODY) throw new Error('BODY_TOO_LARGE');
  const text = await request.text();
  if (text.length > MAX_BODY) throw new Error('BODY_TOO_LARGE');
  try { return JSON.parse(text); }
  catch { throw new Error('BAD_JSON'); }
}

async function analyze(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const suiteType = ['square', 'vertical', 'full'].includes(input.suiteType) ? input.suiteType : 'square';
  const direction = ['standard', 'scene', 'detail', 'procurement'].includes(input.direction) ? input.direction : 'standard';
  if (!input.imageBase64) return failure(400, '缺少商品图片', 'IMAGE_REQUIRED', id);
  const roles = SERIES_ROLES[suiteType];
  const roleLines = roles.map((role, index) => `${index + 1}. ${role}`).join('\n');
  const prompt = `你是中国大陆电商百货商品视觉策划师和图像模型提示词专家。先识别参考图里的真实商品，再制定一套保真、可执行、彼此不重复的电商图片方案。\n\n目标平台策略：${PLATFORM_RULES[platform]}\n套图方向：${DIRECTION_RULES[direction]}\n用户补充：${String(input.userNote || '无').slice(0, 120)}\n\n白底首图由 white_prompt 单独生成，不要把白底图重复放进 series。series 必须正好${roles.length}项，顺序和 label 固定为：\n${roleLines}\n\n只输出合法JSON，不要Markdown：\n{"product_summary":"商品类型、形状、颜色、材质、数量、包装与可见标识的中文摘要","white_prompt":"豆包Seedream白底修图提示词","series":[{"label":"固定任务名称","prompt":"给图片模型的完整中文提示词"}]}\n\n每条图片提示词必须明确：唯一画面目标、商品主体占比、镜头角度、构图、真实场景、灯光、道具数量、留白位置和禁止项。每张只解决一个问题，不能换词重复。必须以参考商品为唯一依据，保持形状、比例、颜色、材质、包装结构、标签原文、商标位置和配件数量；不重新设计，不增减功能，不复制商品，不遮挡主体，不虚构使用效果。画面内禁止新增文字、价格、促销角标、Logo、店铺名、二维码、联系方式、水印、边框、乱码、认证、比较元素和绝对化宣传。不得暗示未经证实的医疗、安全、环保、质量、销量或官方背书。`;
  const response = await timedFetch(ARK_CHAT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({ model: input.visionModel || DEFAULT_VISION_MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: normalizeImage(input.imageBase64) } }] }], temperature: 0.25, max_tokens: suiteType === 'full' ? 4600 : 3000, response_format: { type: 'json_object' } }),
  }, 90000);
  const payload = await remoteJSON(response, 'ARK_CHAT');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); return failure(mapped.status, mapped.message, mapped.code, id); }
  const raw = extractObject(messageText(payload.choices?.[0]?.message?.content));
  const series = Array.isArray(raw.series) ? raw.series.slice(0, roles.length).map((item, index) => ({ label: roles[index], prompt: String(item?.prompt || '').trim().slice(0, 7000) })) : [];
  if (series.length !== roles.length || series.some(item => !item.prompt)) return failure(502, '提示词方案数量不完整，请重新生成', 'PROMPT_PLAN_INCOMPLETE', id);
  return json(200, { product_summary: String(raw.product_summary || '已识别商品主体与外观特征').trim().slice(0, 240), white_prompt: String(raw.white_prompt || '只替换为纯白背景，严格保持商品外观、数量、标签和配件。').trim().slice(0, 5000), series, roles });
}

async function seedream(arkKey, image, prompt, imageModel, aspect) {
  const rule = aspect === 'vertical' ? '2:3竖版详情页构图' : '1:1正方形商品图构图';
  const response = await timedFetch(ARK_IMAGE_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({ model: imageModel || DEFAULT_IMAGE_MODEL, prompt: `${prompt}\n输出要求：${rule}；只生成一张完整图片；严格保持参考商品结构、颜色、数量、包装文字和标识位置；禁止新增文字、价格、Logo、水印和边框。`, image: normalizeImage(image), size: '2K', response_format: 'url', watermark: false }),
  }, 180000);
  const payload = await remoteJSON(response, 'ARK_IMAGE');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
  return imagePayload(payload);
}

async function seedreamCreate(arkKey, image, prompt, imageModel, aspect) {
  const rule = aspect === 'vertical' ? '2:3竖版构图' : aspect === 'wide' ? '16:9横版构图' : '1:1正方形构图';
  const body = { model: imageModel || DEFAULT_IMAGE_MODEL, prompt: `${prompt}\n输出要求：${rule}；只生成一张完整图片；禁止价格、二维码、水印、边框、乱码与无关品牌Logo。`, size: '2K', response_format: 'url', watermark: false };
  if (image) body.image = normalizeImage(image);
  const response = await timedFetch(ARK_IMAGE_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` }, body: JSON.stringify(body),
  }, 180000);
  const payload = await remoteJSON(response, 'ARK_IMAGE');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
  return imagePayload(payload);
}

async function toolImage(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  const toolId = String(input.toolId || '');
  const base = IMAGE_TOOLS[toolId];
  if (!base) return failure(400, '不支持该图片工具', 'TOOL_NOT_SUPPORTED', id);
  const note = String(input.note || '').trim().slice(0, 1200);
  const prompt = `${base}\n用户要求：${note || '采用专业、真实、克制的商业视觉风格。'}`;
  try {
    return json(200, { image: await seedreamCreate(arkKey, input.imageBase64 || '', prompt, input.imageModel, input.aspect), model: 'doubao-seedream', provider: 'doubao' });
  } catch (error) {
    return failure(error.status || 502, error.userMessage || '图片工具暂时未完成', error.message || 'TOOL_IMAGE_FAILED', id);
  }
}

async function toolText(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  const toolId = String(input.toolId || '');
  const systemPrompt = TEXT_TOOLS[toolId];
  if (!systemPrompt) return failure(400, '不支持该文本工具', 'TOOL_NOT_SUPPORTED', id);
  const note = String(input.note || '').trim().slice(0, 6000);
  if (!note && !input.imageBase64) return failure(400, '请填写任务信息或上传参考图', 'TOOL_INPUT_REQUIRED', id);
  const content = [{ type: 'text', text: `${systemPrompt}\n\n用户资料：${note || '请依据参考图完成任务。'}\n\n请使用清晰的中文小标题与列表直接给出成品，不解释思考过程。` }];
  if (input.imageBase64) content.push({ type: 'image_url', image_url: { url: normalizeImage(input.imageBase64) } });
  const response = await timedFetch(ARK_CHAT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({ model: input.visionModel || DEFAULT_VISION_MODEL, messages: [{ role: 'user', content }], temperature: 0.55, max_tokens: 2600 }),
  }, 90000);
  const payload = await remoteJSON(response, 'ARK_CHAT');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); return failure(mapped.status, mapped.message, mapped.code, id); }
  const text = messageText(payload.choices?.[0]?.message?.content).trim();
  if (!text) return failure(502, '文本工具未返回内容，请重试', 'TOOL_TEXT_EMPTY', id);
  return json(200, { text, model: input.visionModel || DEFAULT_VISION_MODEL });
}
async function openai(openaiKey, image, prompt, aspect, model) {
  const { blob, mime } = await imageBlob(normalizeImage(image));
  const form = new FormData();
  form.append('model', model || DEFAULT_OPENAI_IMAGE_MODEL);
  form.append('image', blob, `reference.${mime.includes('png') ? 'png' : 'jpg'}`);
  form.append('prompt', prompt);
  form.append('size', aspect === 'vertical' ? '1024x1536' : '1024x1024');
  form.append('quality', 'medium'); form.append('output_format', 'jpeg'); form.append('output_compression', '88'); form.append('background', 'opaque');
  const response = await timedFetch(OPENAI_IMAGE_URL, { method: 'POST', headers: { Authorization: `Bearer ${openaiKey}` }, body: form }, 210000);
  const payload = await remoteJSON(response, 'OPENAI_IMAGE');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
  return imagePayload(payload);
}
async function whiteImage(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  if (!input.prompt || !input.imageBase64) return failure(400, '缺少白底提示词或商品图片', 'WHITE_INPUT_REQUIRED', id);
  try { return json(200, { image: await seedream(arkKey, input.imageBase64, input.prompt, input.imageModel, 'square'), model: 'doubao-seedream', isBaseImage: true }); }
  catch (error) { return failure(error.status || 502, error.userMessage || '豆包白底图暂时未完成', error.message || 'WHITE_IMAGE_FAILED', id); }
}
async function seriesImage(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const openaiKey = String(request.headers.get('x-openai-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key，作为图片生成和备用引擎', 'ARK_KEY_REQUIRED', id);
  if (!input.prompt || !input.whiteImageBase64) return failure(400, '缺少提示词或白底参考图', 'SERIES_INPUT_REQUIRED', id);
  const aspect = input.aspect === 'vertical' ? 'vertical' : 'square';
  let openaiFailure = '';
  if (openaiKey) {
    try { return json(200, { image: await openai(openaiKey, input.whiteImageBase64, input.prompt, aspect, input.openaiImageModel), model: 'openai', provider: 'openai', fallback: false }); }
    catch (error) { openaiFailure = error.userMessage || 'OpenAI未完成本次生成'; }
  }
  try { return json(200, { image: await seedream(arkKey, input.whiteImageBase64, input.prompt, input.imageModel, aspect), model: 'doubao-seedream', provider: 'doubao', fallback: Boolean(openaiKey), openaiFailure }); }
  catch (error) { return failure(error.status || 502, openaiKey ? `OpenAI与豆包均未完成：${error.userMessage || '请稍后重试'}` : error.userMessage || '豆包暂时未完成生成', 'ALL_MODELS_FAILED', id); }
}
async function qc(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
  if (!input.whiteImageBase64 || !input.generatedImageBase64) return failure(400, '缺少质检对比图片', 'QC_IMAGES_REQUIRED', id);
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const prompt = `你是中国大陆电商商品图质检员。第1张图是商品白底基准图，第2张图是待检生成图。任务：${String(input.taskLabel || '商品图').slice(0, 40)}。平台要求：${PLATFORM_RULES[platform]}\n\n严格检查商品形状、比例、颜色、材质、包装结构、标签与商标位置、配件数量；检查复制、增减结构、错误使用、畸形手部、新文字、价格、二维码、水印、其他品牌Logo或虚构宣传。只输出合法JSON：{"pass":true,"score":0,"summary":"不超过40字中文结论","correction":"不通过时给图片模型的不超过180字精准修改要求，通过则为空"}。只有评分不低于80且没有商品失真或违规文字时才能通过。`;
  const response = await timedFetch(ARK_CHAT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({ model: input.visionModel || DEFAULT_VISION_MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: normalizeImage(input.whiteImageBase64) } }, { type: 'image_url', image_url: { url: normalizeImage(input.generatedImageBase64) } }] }], temperature: 0.1, max_tokens: 800, response_format: { type: 'json_object' } }),
  }, 90000);
  const payload = await remoteJSON(response, 'ARK_QC');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); return failure(mapped.status, '自动质检暂时无法完成', mapped.code, id); }
  const raw = extractObject(messageText(payload.choices?.[0]?.message?.content));
  const score = Math.max(0, Math.min(100, Math.round(Number(raw.score) || 0)));
  const pass = raw.pass === true && score >= 80;
  return json(200, { pass, score, summary: String(raw.summary || (pass ? '商品一致性与画面质量通过' : '发现需要修正的问题')).slice(0, 80), correction: pass ? '' : String(raw.correction || raw.summary || '严格恢复商品真实结构并移除错误元素').slice(0, 300) });
}

export async function handleApiRequest(request, endpoint) {
  const id = String(request.headers.get('x-request-id') || crypto.randomUUID()).replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 50);
  try {
    const input = await parseInput(request);
    if (endpoint === 'analyze') return await analyze(request, input, id);
    if (endpoint === 'white-image') return await whiteImage(request, input, id);
    if (endpoint === 'series-image') return await seriesImage(request, input, id);
    if (endpoint === 'qc') return await qc(request, input, id);
    if (endpoint === 'tool-image') return await toolImage(request, input, id);
    if (endpoint === 'tool-text') return await toolText(request, input, id);
    return failure(404, '接口不存在', 'NOT_FOUND', id);
  } catch (error) {
    if (error.message === 'BAD_JSON') return failure(400, '请求格式错误', 'BAD_JSON', id);
    const mapped = classify(error);
    return failure(mapped.status, mapped.message, mapped.code, id);
  }
}
