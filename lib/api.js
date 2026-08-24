const MAX_BODY = 40 * 1024 * 1024;
const ARK_CHAT_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions';
const ARK_RESPONSES_URL = 'https://ark.cn-beijing.volces.com/api/v3/responses';
const ARK_IMAGE_URL = 'https://ark.cn-beijing.volces.com/api/v3/images/generations';
const OPENAI_IMAGE_URL = 'https://api.openai.com/v1/images/edits';
const OPENAI_IMAGE_GENERATE_URL = 'https://api.openai.com/v1/images/generations';
const OPENAI_MODELS_URL = 'https://api.openai.com/v1/models';
const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';
const DEFAULT_VISION_MODEL = 'doubao-seed-2-0-lite-260428';
const DEFAULT_IMAGE_MODEL = 'doubao-seedream-5-0-260128';
const DEFAULT_OPENAI_IMAGE_MODEL = 'gpt-image-2';
const DEFAULT_GEMINI_TEXT_MODEL = 'gemini-3.7-flash';
const DEFAULT_GEMINI_IMAGE_MODEL = 'gemini-3.1-flash-image';

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
  'seedream-studio': '使用Seedream生成或编辑高质量商业图片，准确遵循主体、构图、风格、光线和文字留白要求。',
  'gpt-image-studio': '使用GPT Image生成或编辑高质量图片，重点保证复杂指令遵循、主体一致性和自然细节。',
  'nano-banana-studio': '使用Nano Banana生成或编辑图片，充分利用多参考图保持商品、人物和风格一致。',
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
  'text-copywriter': '你是中文商业文案专家。根据资料输出可直接发布的主标题、副标题、正文、核心卖点、行动引导和标签；不得编造功效、销量、认证或价格。',
  'title-optimizer': '你是标题优化专家。先指出原标题的问题，再给出10个不同角度的优化标题，并标注各自适用平台、关键词和字符数。',
  'text-translate': '你是专业本地化翻译。准确翻译用户内容，保留段落、数字、品牌名与格式；同时给出自然版和忠实版，不擅自增加事实。',
  'text-rewrite': '你是资深编辑。保持原意和事实不变，按用户指定的语气、受众和平台完成改写，并给出精简版与完整版。',
  'script-writer': '你是短视频脚本策划师。输出可直接拍摄的脚本，包含时长、镜头、画面、台词或旁白、字幕、音效与转场。',
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Ark-Key, X-OpenAI-Key, X-Gemini-Key, X-Request-Id',
  'Cache-Control': 'no-store',
  'X-Content-Type-Options': 'nosniff',
};

const PLATFORM_RULES = {
  taobao: '淘宝：真实精致、自然生活感、柔和商业布光、中等信息密度和适度留白；商品占画面约55%至72%；避免廉价促销感、过度锐化和堆砌道具。',
  pdd: '拼多多：优先手机端小图识别；商品占画面约70%至85%，轮廓和明暗对比直接；每张只表达一个卖点，道具少；禁止生成价格、折扣和促销角标。',
  '1688': '1688：面向采购判断，采用中性、标准化、专业目录式布光；突出真实结构、材质、工艺、接口、包装和尺度感；不得虚构规格、起订量、认证或供应能力。',
};
const DIRECTION_RULES = {
  auto: '平台自动匹配：根据商品特征与目标平台自动平衡第一眼识别、卖点、功能、材质、尺寸和真实场景；每张承担不同转化任务。',
  click: '提升点击率：优先手机端第一眼识别，强化商品主体、轮廓对比和一个最重要的可见卖点；不得虚构价格、折扣或销量。',
  conversion: '提升转化率：完整覆盖白底保真、功能理解、材质证明、尺寸判断、使用场景与购买决策，避免重复画面。',
  reference: '参考图复刻：第一张图是用户自己的商品，第二张图仅作视觉参考；借鉴参考图的构图、机位、配色、光线和信息节奏，但必须替换为用户商品，禁止复制参考图品牌、Logo、文字、人物身份和受保护元素。',
  standard: '平台自动匹配：均衡真实展示、使用理解、质量证明、尺度判断和转化构图。',
  scene: '提升点击率：强化真实使用关系、主体识别和自然生活氛围。',
  detail: '提升转化率：强化功能、纹理、边缘、接口、表面做工和尺度判断。',
  procurement: '平台自动匹配：结合平台规则展示结构、包装和采购判断信息。',
};
const SERIES_ROLES = {
  square: ['核心卖点场景', '材质做工细节', '尺寸使用感知', '转化留白构图'],
  vertical: ['首屏卖点概览', '核心结构功能', '材质工艺证明', '尺寸适配说明', '使用场景收尾'],
  full: ['核心卖点场景', '材质做工细节', '尺寸使用感知', '转化留白构图', '首屏卖点概览', '核心结构功能', '材质工艺证明', '尺寸适配说明', '使用场景收尾'],
};
const TOOL_SCENE_ROLES = {
  auto: [
    '核心商品主视觉：正面或最有识别度的角度，主体突出、背景克制',
    '真实使用场景：清楚展示商品在日常环境中的用途与关系',
    '第二使用环境：更换空间、道具和构图，展示另一种合理用法',
    '功能操作演示：若用途适用，呈现手部互动或关键操作过程',
    '材质细节特写：微距展示纹理、边缘、接口或工艺，不改变结构',
    '尺寸容量感知：通过真实比例参照体现大小、容量或占地关系',
    '侧面结构视角：采用不同机位展示厚度、背面或内部结构',
    '搭配收纳关系：展示与合理配套物品的组合、收纳或陈列方式',
    '转化留白构图：保留干净文案空间，适合电商主图或广告投放',
    '系列收尾氛围：用不同光线与环境完成高质感品牌收尾画面',
  ],
  lifestyle: [
    '日间居家使用：自然日光、真实生活空间与清楚的使用关系',
    '第二空间使用：更换房间或环境，展示另一种合理使用场景',
    '近景互动：若用途适用，呈现手部操作、拿取或放置动作',
    '远景环境关系：拉远镜头体现商品与完整空间的尺度关系',
    '使用状态细节：聚焦正在使用时的关键结构、材质或功能区域',
    '搭配收纳场景：与合理配套物品共同出现，画面整洁可信',
    '小空间应用：展示紧凑环境中的摆放、使用或收纳价值',
    '高质感生活方式：编辑感构图与克制道具，保持商品真实',
    '暖光晚间场景：改变时间、光线和氛围，展示温暖使用体验',
    '清爽收尾场景：明亮简洁的另一环境，作为系列最后一张',
  ],
  ecommerce: [
    '纯净商品主图：主体完整、轮廓清楚、背景干净且不添加虚假文字',
    '三分之四角度：以不同机位展示结构、体积和外观层次',
    '核心功能图：用可见事实呈现一个关键用途，不虚构功效',
    '材质工艺图：特写表面、边缘、接口或做工细节',
    '尺寸容量图：用真实参照关系表达大小，保留参数标注空间',
    '配件包装图：若素材提供，整齐展示包装、附件和组合关系',
    '真实使用图：在合理场景中展示商品如何被使用',
    '痛点解决图：以可见场景表达使用前后关系，不编造数据',
    '广告留白图：突出主体并预留标题、卖点与按钮安全区',
    '品牌收尾图：统一系列调性，以高级简洁构图完成收尾',
  ],
  creative: [
    '标志性主视觉：大胆但克制的构图，保持商品结构绝对真实',
    '色彩主题画面：使用独立配色与背景，突出主体轮廓',
    '光影实验画面：用不同方向的硬光或柔光塑造材质',
    '材质空间画面：用与商品气质匹配的表面和空间形成对比',
    '微距抽象细节：极近距离呈现纹理、边缘或结构节奏',
    '动态构图画面：利用悬浮、斜线或运动感，但不改变商品',
    '极简编辑画面：大面积留白和杂志感排版区域，不生成文字',
    '场景叙事画面：以道具和环境建立一个合理的小故事',
    '图形化广告画面：使用几何色块和层次突出商品卖点',
    '系列封面收尾：形成可作封面的独立构图并统一品牌气质',
  ],
};

function toolSceneRoles(mode, count) {
  const roles = TOOL_SCENE_ROLES[mode] || TOOL_SCENE_ROLES.auto;
  return Array.from({ length: count }, (_, index) => roles[index] || `独立扩展场景 ${index + 1}：更换环境、机位、构图与光线`);
}

function json(status, data) {
  return Response.json(data, { status, headers: CORS });
}
function failure(status, message, code, requestId = '', details = {}) {
  return json(status, { error: message, code: code || 'UNKNOWN', requestId, ...details });
}
function classify(error, status = 0) {
  const text = String(error?.message || error || '').toLowerCase();
  if (error?.name === 'AbortError' || text.includes('timeout')) return { status: 504, code: 'GEN_TIMEOUT', message: 'AI处理超时，请稍后重试' };
  if (text.includes('body_too_large')) return { status: 413, code: 'IMAGE_TOO_LARGE', message: '请求图片体积过大，请压缩后重试' };
  if (status === 401 || text.includes('invalid_api_key') || text.includes('authentication') || text.includes('invalid api key')) return { status: 401, code: 'INVALID_KEY', message: 'API Key无效、过期或不属于当前服务' };
  if (status === 403 || text.includes('permission') || text.includes('forbidden') || text.includes('access denied')) return { status: 403, code: 'MODEL_FORBIDDEN', message: '密钥有效，但当前账户没有开通所选模型权限' };
  if (status === 404 || text.includes('model_not_found') || text.includes('modelnotexist') || text.includes('not found for api version')) return { status: 404, code: 'MODEL_NOT_FOUND', message: '所选模型名称不可用，请恢复默认模型或检查账户区域' };
  if (status === 429 || text.includes('rate_limit') || text.includes('frequency')) return { status: 429, code: 'RATE_LIMIT', message: '请求过于频繁，请稍后重试' };
  if (status === 402 || text.includes('insufficient_quota') || text.includes('balance') || text.includes('quota')) return { status: 402, code: 'NO_QUOTA', message: '账户余额或生成额度不足' };
  if (text.includes('content_policy') || text.includes('safety') || text.includes('moderation')) return { status: 400, code: 'CONTENT_BLOCKED', message: '请求被模型安全规则拒绝，请调整图片或提示词' };
  return { status: status >= 400 && status < 600 ? status : 502, code: 'UPSTREAM_FAILED', message: 'AI服务暂时未完成请求，请稍后重试' };
}
function upstreamError(payload, status, provider) {
  const detail = remoteMessage(payload);
  const mapped = classify(detail, status);
  const error = new Error(mapped.code);
  error.userMessage = `${provider}${mapped.message}`;
  error.status = mapped.status;
  return error;
}
async function timedFetch(url, options, timeoutMs) {
  const retryTls = String(url).includes('ark.cn-beijing.volces.com');
  let response;
  for (let attempt = 0; attempt < (retryTls ? 3 : 1); attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try { response = await fetch(url, { ...options, signal: controller.signal }); }
    finally { clearTimeout(timer); }
    if (response.status !== 525 || attempt === 2) return response;
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  return response;
}
async function remoteJSON(response, service) {
  const raw = (await response.text()).replace(/^\uFEFF/, '').trim();
  try {
    const parsed = JSON.parse(raw);
    if (service === 'ARK_RESPONSES' && parsed?.response && typeof parsed.response === 'object') return parsed.response;
    if (response.ok && service === 'ARK_CHAT' && !parsed?.choices && (parsed?.prompts || parsed?.summary || parsed?.text)) {
      return { choices: [{ message: { content: raw } }] };
    }
    return parsed;
  }
  catch {
    const events = raw.split(/\r?\n/)
      .map(line => line.trim())
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())
      .filter(value => value && value !== '[DONE]');
    const parsedEvents = [];
    for (const event of events) {
      try { parsedEvents.push(JSON.parse(event)); } catch {}
    }
    if (service === 'ARK_RESPONSES' && parsedEvents.length) {
      const completed = [...parsedEvents].reverse().find(item => item?.response)?.response;
      if (completed) return completed;
      const deltas = parsedEvents.map(item => item?.delta).filter(value => typeof value === 'string');
      if (deltas.length) return { output_text: deltas.join('') };
    }
    for (let index = parsedEvents.length - 1; index >= 0; index -= 1) {
      return parsedEvents[index];
    }
    const contentType = String(response.headers.get('content-type') || '').toLowerCase();
    if (response.ok && raw && !/^\s*</.test(raw)) {
      return service === 'ARK_RESPONSES'
        ? { output_text: raw }
        : { choices: [{ message: { content: raw } }] };
    }
    const isTls525 = response.status === 525;
    const error = new Error(isTls525 ? `${service}_TLS_525` : `${service}_FORMAT`);
    error.status = response.ok ? 502 : (response.status || 502);
    const safeType = contentType.split(';')[0] || '未提供';
    error.userMessage = isTls525
      ? 'Cloudflare 到火山方舟的 TLS 握手失败（HTTP 525），已自动重试但上游仍不可达'
      : `${service === 'ARK_CHAT' || service === 'ARK_RESPONSES' ? '火山方舟' : service}返回了无法识别的数据格式（HTTP ${response.status || 0}，${safeType}，${raw.length}字节），请检查模型开通状态或网关配置`;
    throw error;
  }
}
function remoteMessage(payload) {
  return String(payload?.error?.message || payload?.message || payload?.error || '');
}
function extractObject(text) {
  const clean = String(text || '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('MODEL_JSON_INVALID');
  try { return JSON.parse(clean.slice(start, end + 1)); }
  catch { throw new Error('MODEL_JSON_INVALID'); }
}
function providerFailure(provider, error) {
  const code = String(error?.message || 'UPSTREAM_FAILED');
  const mapped = classify(error, Number(error?.status) || 0);
  const messages = {
    MODEL_JSON_INVALID: '模型返回的内容不是有效 JSON',
    GEMINI_TEXT_EMPTY: 'Gemini 已响应但没有返回文字',
    PROMPT_PLAN_INCOMPLETE: '模型返回的提示词数量不完整',
  };
  return {
    provider,
    code,
    status: Number(error?.status) || mapped.status,
    message: String(error?.userMessage || messages[code] || mapped.message),
  };
}
function combinedProviderError(requestedProvider, failures, fallbackMessage) {
  const labels = { gemini: 'Gemini', doubao: '火山方舟' };
  const primary = failures.find(item => item.provider === requestedProvider) || failures[0] || {};
  const detail = failures.map(item => `${labels[item.provider] || item.provider}：${item.message}（${item.code}）`).join('；');
  const error = new Error(primary.code || 'TEXT_PROVIDERS_FAILED');
  error.status = primary.status || 502;
  error.userMessage = detail ? `${fallbackMessage}。${detail}` : fallbackMessage;
  error.providerFailures = failures;
  return error;
}
function messageText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(item => typeof item === 'string' ? item : item?.text || item?.content || '').join('\n');
}
function arkMessageText(payload) {
  const message = payload?.choices?.[0]?.message;
  return messageText(message?.content).trim() || messageText(message?.reasoning_content).trim();
}

function arkResponseText(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text.trim();
  const parts = [];
  const queue = Array.isArray(payload?.output) ? [...payload.output] : [];
  while (queue.length) {
    const item = queue.shift();
    if (!item || typeof item !== 'object') continue;
    const value = item?.text?.value ?? item?.text ?? item?.output_text;
    if (typeof value === 'string') parts.push(value);
    for (const key of ['content', 'output', 'message', 'response']) {
      const child = item[key];
      if (Array.isArray(child)) queue.push(...child);
      else if (child && typeof child === 'object') queue.push(child);
    }
  }
  return parts.join('\n').trim();
}
function normalizeImage(value, fallback = 'image/jpeg') {
  if (typeof value !== 'string' || !value.trim()) throw new Error('IMAGE_MISSING');
  if (value.startsWith('data:image/') || value.startsWith('https://')) return value;
  return `data:${fallback};base64,${value}`;
}
function dataImage(value) {
  const normalized = normalizeImage(value);
  const match = normalized.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);
  if (!match) throw new Error('REFERENCE_IMAGE_INVALID');
  return { mime_type: match[1], data: match[2] };
}
function imageList(input, limit = 10) {
  const values = Array.isArray(input.imageBase64s) ? input.imageBase64s : input.imageBase64 ? [input.imageBase64] : [];
  return values.filter(value => typeof value === 'string' && value.trim()).slice(0, limit);
}
function cleanModelId(value) {
  return String(value || '').trim().split(/\s+/)[0].replace(/[，。；;,]+$/g, '');
}
function geminiBlocks(payload) {
  const blocks = [];
  const queue = [payload];
  const seen = new Set();
  while (queue.length) {
    const value = queue.shift();
    if (!value || typeof value !== 'object' || seen.has(value)) continue;
    seen.add(value);
    if ((value.type === 'text' && typeof value.text === 'string') || (value.type === 'image' && value.data)) blocks.push(value);
    for (const [key, child] of Object.entries(value)) {
      if (key === 'data') continue;
      if (Array.isArray(child)) queue.push(...child);
      else if (child && typeof child === 'object') queue.push(child);
    }
  }
  return blocks;
}
function geminiTextOutput(payload) {
  if (typeof payload?.output_text === 'string') return payload.output_text;
  const blocks = geminiBlocks(payload);
  return blocks.filter(block => block?.type === 'text' && typeof block.text === 'string').map(block => block.text).join('\n');
}
function geminiImageOutput(payload) {
  if (payload?.output_image?.data) return `data:${payload.output_image.mime_type || 'image/png'};base64,${payload.output_image.data}`;
  const blocks = geminiBlocks(payload);
  const image = [...blocks].reverse().find(block => block?.type === 'image' && block.data);
  if (image) return `data:${image.mime_type || 'image/png'};base64,${image.data}`;
  throw new Error('IMAGE_EMPTY');
}
async function geminiRequest(geminiKey, body, timeoutMs = 120000) {
  const response = await timedFetch(GEMINI_INTERACTIONS_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': geminiKey }, body: JSON.stringify(body),
  }, timeoutMs);
  const payload = await remoteJSON(response, 'GEMINI');
  if (!response.ok) {
    const mapped = classify(remoteMessage(payload), response.status);
    const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error;
  }
  return payload;
}
async function geminiText(geminiKey, prompt, images, model, options = {}) {
  const input = [{ type: 'text', text: prompt }];
  for (const image of images.slice(0, 10)) input.push({ type: 'image', ...dataImage(image) });
  const generationConfig = { thinking_level: options.thinkingLevel || 'low' };
  if (options.maxTokens) generationConfig.max_output_tokens = options.maxTokens;
  const body = { model: model || DEFAULT_GEMINI_TEXT_MODEL, input, generation_config: generationConfig };
  if (options.json) body.response_format = { type: 'text', mime_type: 'application/json' };
  const payload = await geminiRequest(geminiKey, body, options.timeoutMs || 90000);
  if (payload?.status === 'failed') {
    const detail = payload.errors?.map(item => item?.message).filter(Boolean).join('；') || 'Gemini 交互执行失败';
    const mapped = classify(detail, 502);
    throw Object.assign(new Error(mapped.code), { status: mapped.status, userMessage: mapped.message });
  }
  const text = geminiTextOutput(payload).trim();
  if (!text) throw new Error('GEMINI_TEXT_EMPTY');
  return text;
}
async function arkText(arkKey, prompt, images, model, options = {}) {
  const selectedModel = cleanModelId(model) || DEFAULT_VISION_MODEL;
  if (String(selectedModel).toLowerCase().includes('deepseek') && !images.length) {
    const deepseekTokens = Math.max(256, options.maxTokens || 2600);
    try {
      const chatResponse = await timedFetch(ARK_CHAT_URL, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
        body: JSON.stringify({ model: selectedModel, messages: [{ role: 'user', content: prompt }], temperature: options.temperature ?? 0.3, max_tokens: deepseekTokens, stream: false }),
      }, options.timeoutMs || 90000);
      const chatPayload = await remoteJSON(chatResponse, 'ARK_CHAT');
      if (!chatResponse.ok) throw upstreamError(chatPayload, chatResponse.status, '火山方舟 DeepSeek：');
      const chatText = arkMessageText(chatPayload);
      if (chatText) return chatText;
    } catch (error) {
      if (!String(error?.message || '').includes('ARK_CHAT_FORMAT') && error?.message !== 'ARK_TEXT_EMPTY') throw error;
    }
    const response = await timedFetch(ARK_RESPONSES_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
      body: JSON.stringify({ model: selectedModel, input: prompt, max_output_tokens: deepseekTokens, stream: false }),
    }, options.timeoutMs || 90000);
    const payload = await remoteJSON(response, 'ARK_RESPONSES');
    if (!response.ok) throw upstreamError(payload, response.status, '火山方舟 DeepSeek：');
    const text = arkResponseText(payload);
    if (!text) throw Object.assign(new Error('ARK_RESPONSES_EMPTY'), { userMessage: 'DeepSeek 已响应但没有返回最终文字，请确认模型已开通 Chat 或 Responses API' });
    return text;
  }
  const content = [{ type: 'text', text: prompt }];
  for (const image of images.slice(0, 10)) content.push({ type: 'image_url', image_url: { url: normalizeImage(image) } });
  const body = {
    model: selectedModel,
    messages: [{ role: 'user', content }],
    temperature: options.temperature ?? 0.3,
    max_tokens: options.maxTokens || 5200,
  };
  if (options.json) body.response_format = { type: 'json_object' };
  const response = await timedFetch(ARK_CHAT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` }, body: JSON.stringify(body),
  }, options.timeoutMs || 90000);
  const payload = await remoteJSON(response, 'ARK_CHAT');
  if (!response.ok) throw upstreamError(payload, response.status, '火山方舟：');
  const text = arkMessageText(payload);
  if (!text) throw new Error('ARK_TEXT_EMPTY');
  return text;
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
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const textProvider = input.textProvider === 'gemini' ? 'gemini' : 'doubao';
  if (!geminiKey && !arkKey) return failure(400, '请先填写 Gemini 或火山方舟 API Key', 'TEXT_KEY_REQUIRED', id);
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const suiteType = ['square', 'vertical', 'full'].includes(input.suiteType) ? input.suiteType : 'square';
  const direction = ['auto', 'click', 'conversion', 'reference', 'standard', 'scene', 'detail', 'procurement'].includes(input.direction) ? input.direction : 'auto';
  if (!input.imageBase64) return failure(400, '缺少商品图片', 'IMAGE_REQUIRED', id);
  if (direction === 'reference' && !input.referenceImageBase64) return failure(400, '参考图复刻需要上传参考图片', 'REFERENCE_IMAGE_REQUIRED', id);
  const roles = SERIES_ROLES[suiteType];
  const roleLines = roles.map((role, index) => `${index + 1}. ${role}`).join('\n');
  const targetModel = input.imageProvider === 'openai' ? 'GPT Image 2' : input.imageProvider === 'gemini' ? 'Nano Banana 2' : 'Seedream 5.0';
  const prompt = `你是中国大陆电商百货商品视觉策划师和图像模型提示词专家。先识别参考图里的真实商品，再为${targetModel}制定一套保真、可执行、彼此不重复的电商图片方案。\n\n目标平台策略：${PLATFORM_RULES[platform]}\n套图方向：${DIRECTION_RULES[direction]}\n用户补充：${String(input.userNote || '无').slice(0, 2000)}\n\n白底首图由 white_prompt 单独生成，不要把白底图重复放进 series。series 必须正好${roles.length}项，顺序和 label 固定为：\n${roleLines}\n\n只输出合法JSON，不要Markdown：\n{"product_summary":"商品类型、形状、颜色、材质、数量、包装与可见标识的中文摘要","white_prompt":"给${targetModel}的白底保真修图提示词","series":[{"label":"固定任务名称","prompt":"给${targetModel}的完整中文提示词"}]}\n\n每条图片提示词必须明确：唯一画面目标、商品主体占比、镜头角度、构图、真实场景、灯光、道具数量、留白位置和禁止项。每张只解决一个问题，不能换词重复。必须以参考商品为唯一依据，保持形状、比例、颜色、材质、包装结构、标签原文、商标位置和配件数量；不重新设计，不增减功能，不复制商品，不遮挡主体，不虚构使用效果。画面内禁止新增文字、价格、促销角标、Logo、店铺名、二维码、联系方式、水印、边框、乱码、认证、比较元素和绝对化宣传。不得暗示未经证实的医疗、安全、环保、质量、销量或官方背书。`;
  const visionImages = [input.imageBase64, ...(direction === 'reference' ? [input.referenceImageBase64] : [])];
  const attempts = textProvider === 'gemini'
    ? ['gemini', ...(arkKey ? ['doubao'] : [])]
    : ['doubao', ...(geminiKey ? ['gemini'] : [])];
  let raw;
  let usedProvider = textProvider;
  let usedModel = textProvider === 'gemini' ? input.geminiTextModel || DEFAULT_GEMINI_TEXT_MODEL : input.visionModel || DEFAULT_VISION_MODEL;
  const providerFailures = [];
  for (const provider of attempts) {
    try {
      if (provider === 'gemini') {
        usedModel = input.geminiTextModel || DEFAULT_GEMINI_TEXT_MODEL;
        raw = extractObject(await geminiText(geminiKey, prompt, visionImages, usedModel, { json: true, maxTokens: suiteType === 'full' ? 4600 : 3000 }));
      } else {
        usedModel = input.visionModel || DEFAULT_VISION_MODEL;
        raw = extractObject(await arkText(arkKey, prompt, visionImages, usedModel, { json: true, temperature: 0.25, maxTokens: suiteType === 'full' ? 4600 : 3000 }));
      }
      usedProvider = provider;
      break;
    } catch (error) {
      providerFailures.push(providerFailure(provider, error));
    }
  }
  if (!raw) {
    const error = combinedProviderError(textProvider, providerFailures, '商品理解与提示词规划暂时未完成');
    return failure(error.status, error.userMessage, error.message, id, { providerFailures: error.providerFailures });
  }
  const series = Array.isArray(raw.series) ? raw.series.slice(0, roles.length).map((item, index) => ({ label: roles[index], prompt: String(item?.prompt || '').trim().slice(0, 7000) })) : [];
  if (series.length !== roles.length || series.some(item => !item.prompt)) return failure(502, '提示词方案数量不完整，请重新生成', 'PROMPT_PLAN_INCOMPLETE', id);
  return json(200, { product_summary: String(raw.product_summary || '已识别商品主体与外观特征').trim().slice(0, 240), white_prompt: String(raw.white_prompt || '只替换为纯白背景，严格保持商品外观、数量、标签和配件。').trim().slice(0, 5000), series, roles, provider: usedProvider, model: usedModel, fallback: usedProvider !== textProvider });
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

async function seedreamCreate(arkKey, images, prompt, imageModel, aspect) {
  const rule = aspect === 'vertical' ? '2:3竖版构图' : aspect === 'wide' ? '16:9横版构图' : '1:1正方形构图';
  const body = { model: imageModel || DEFAULT_IMAGE_MODEL, prompt: `${prompt}\n输出要求：${rule}；只生成一张完整图片；禁止价格、二维码、水印、边框、乱码与无关品牌Logo。`, size: '2K', response_format: 'url', watermark: false };
  const refs = (Array.isArray(images) ? images : images ? [images] : []).filter(Boolean).slice(0, 10).map(image => normalizeImage(image));
  if (refs.length) body.image = refs.length === 1 ? refs[0] : refs;
  const response = await timedFetch(ARK_IMAGE_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` }, body: JSON.stringify(body),
  }, 180000);
  const payload = await remoteJSON(response, 'ARK_IMAGE');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
  return imagePayload(payload);
}

async function geminiImage(geminiKey, images, prompt, aspect, model) {
  const ratio = aspect === 'vertical' ? '2:3' : aspect === 'wide' ? '16:9' : '1:1';
  const input = [{ type: 'text', text: `${prompt}\n只输出一张完整图片；严格遵循参考图身份与商品结构；禁止无关品牌、二维码、水印和乱码。` }];
  for (const image of images.slice(0, 10)) input.push({ type: 'image', ...dataImage(image) });
  const payload = await geminiRequest(geminiKey, {
    model: model || DEFAULT_GEMINI_IMAGE_MODEL,
    input,
    response_format: { type: 'image', mime_type: 'image/jpeg', aspect_ratio: ratio, image_size: '1K' },
  }, 210000);
  return geminiImageOutput(payload);
}

async function openaiCreate(openaiKey, images, prompt, aspect, model) {
  const size = aspect === 'vertical' ? '1024x1536' : aspect === 'wide' ? '1536x1024' : '1024x1024';
  if (!images.length) {
    const response = await timedFetch(OPENAI_IMAGE_GENERATE_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: model || DEFAULT_OPENAI_IMAGE_MODEL, prompt, size, quality: 'medium', output_format: 'jpeg' }),
    }, 210000);
    const payload = await remoteJSON(response, 'OPENAI_IMAGE');
    if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
    return imagePayload(payload);
  }
  const form = new FormData();
  form.append('model', model || DEFAULT_OPENAI_IMAGE_MODEL);
  for (const image of images.slice(0, 10)) {
    const { blob, mime } = await imageBlob(normalizeImage(image));
    form.append(images.length === 1 ? 'image' : 'image[]', blob, `reference.${mime.includes('png') ? 'png' : 'jpg'}`);
  }
  form.append('prompt', prompt); form.append('size', size); form.append('quality', 'medium'); form.append('output_format', 'jpeg'); form.append('output_compression', '88'); form.append('background', 'opaque');
  const response = await timedFetch(OPENAI_IMAGE_URL, { method: 'POST', headers: { Authorization: `Bearer ${openaiKey}` }, body: form }, 210000);
  const payload = await remoteJSON(response, 'OPENAI_IMAGE');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); const error = new Error(mapped.code); error.userMessage = mapped.message; error.status = mapped.status; throw error; }
  return imagePayload(payload);
}

function imageProviderName(provider) {
  return provider === 'gemini' ? 'Nano Banana 2' : provider === 'openai' ? 'GPT Image 2' : 'Seedream 5.0';
}
function imageProviderKey(provider, keys) {
  return provider === 'gemini' ? keys.gemini : provider === 'openai' ? keys.openai : keys.ark;
}
function imageProviderKeyCode(provider) {
  return provider === 'gemini' ? 'GEMINI_KEY_REQUIRED' : provider === 'openai' ? 'OPENAI_KEY_REQUIRED' : 'ARK_KEY_REQUIRED';
}
function missingImageKey(provider) {
  const error = new Error(imageProviderKeyCode(provider));
  error.status = 400;
  error.userMessage = `请先填写${provider === 'gemini' ? ' Gemini' : provider === 'openai' ? ' OpenAI' : '火山方舟'} API Key`;
  return error;
}
function canFallbackImage(error) {
  return !['CONTENT_BLOCKED', 'REFERENCE_IMAGE_INVALID', 'IMAGE_MISSING', 'PROMPT_REQUIRED'].includes(String(error?.message || ''));
}
async function imageWithFallback(requestedProvider, keys, images, prompt, aspect, input, preserveReference = false) {
  const allowFallback = input.allowFallback !== false;
  const order = [requestedProvider, 'gemini', 'seedream', 'openai'];
  const candidates = [...new Set(order)].filter(provider => imageProviderKey(provider, keys));
  if (!candidates.length) throw missingImageKey(requestedProvider);
  if (!allowFallback && !imageProviderKey(requestedProvider, keys)) throw missingImageKey(requestedProvider);
  const attempts = allowFallback ? candidates : [requestedProvider];
  let firstError;
  let lastError;
  for (const provider of attempts) {
    try {
      let image;
      let model;
      if (provider === 'gemini') {
        model = input.geminiImageModel || DEFAULT_GEMINI_IMAGE_MODEL;
        image = await geminiImage(keys.gemini, images, prompt, aspect, model);
      } else if (provider === 'openai') {
        model = input.openaiImageModel || DEFAULT_OPENAI_IMAGE_MODEL;
        image = await openaiCreate(keys.openai, images, prompt, aspect, model);
      } else {
        model = input.imageModel || DEFAULT_IMAGE_MODEL;
        image = preserveReference && images[0]
          ? await seedream(keys.ark, images[0], prompt, model, aspect)
          : await seedreamCreate(keys.ark, images, prompt, model, aspect);
      }
      return {
        image,
        model,
        provider,
        requestedProvider,
        fallback: provider !== requestedProvider,
        fallbackFrom: provider !== requestedProvider ? imageProviderName(requestedProvider) : '',
        fallbackCode: provider !== requestedProvider ? String(firstError?.message || imageProviderKeyCode(requestedProvider)) : '',
      };
    } catch (error) {
      if (!firstError) firstError = error;
      lastError = error;
      if (!canFallbackImage(error)) break;
    }
  }
  throw lastError || firstError || new Error('IMAGE_GENERATION_FAILED');
}

async function toolImage(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const openaiKey = String(request.headers.get('x-openai-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const toolId = String(input.toolId || '');
  const base = IMAGE_TOOLS[toolId];
  if (!base) return failure(400, '不支持该图片工具', 'TOOL_NOT_SUPPORTED', id);
  const provider = ['seedream', 'openai', 'gemini'].includes(input.provider) ? input.provider : 'seedream';
  const images = imageList(input);
  const editedPrompt = String(input.prompt || '').trim().slice(0, 12000);
  if (!editedPrompt) return failure(400, '请先生成并确认图片提示词', 'PROMPT_REQUIRED', id);
  const prompt = `${base}\n已确认提示词：${editedPrompt}`;
  try {
    return json(200, await imageWithFallback(provider, { ark: arkKey, openai: openaiKey, gemini: geminiKey }, images, prompt, input.aspect, input));
  } catch (error) {
    return failure(error.status || 502, error.userMessage || '图片工具暂时未完成', error.message || 'TOOL_IMAGE_FAILED', id);
  }
}

async function toolPrompt(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const toolId = String(input.toolId || '');
  const base = IMAGE_TOOLS[toolId];
  if (!base) return failure(400, '不支持该图片工具', 'TOOL_NOT_SUPPORTED', id);
  const images = imageList(input);
  const note = String(input.note || '').trim().slice(0, 6000);
  const outputCount = Math.max(1, Math.min(10, Number(input.outputCount) || 1));
  const requestedSceneMode = ['auto', 'lifestyle', 'ecommerce', 'creative'].includes(input.sceneMode) ? input.sceneMode : '';
  const sceneMode = requestedSceneMode || (outputCount > 1 ? 'auto' : '');
  const sceneRoles = sceneMode ? toolSceneRoles(sceneMode, outputCount) : [];
  const targetModel = input.provider === 'openai' ? 'GPT Image 2' : input.provider === 'gemini' ? 'Nano Banana 2' : 'Seedream 5.0';
  const aspect = input.aspect === 'vertical' ? '2:3竖版' : input.aspect === 'wide' ? '16:9横版' : '1:1正方形';
  const scenePlan = sceneRoles.length ? `\n本组固定画面任务（必须逐项对应，不得调换或合并）：\n${sceneRoles.map((role, index) => `${index + 1}. ${role}`).join('\n')}\n每一项都必须是一张独立的单场景图片；禁止拼图、分屏、多宫格、多方案合成和只换词重复。除非用户明确要求，不要只展示包装。相邻图片必须在场景、构图、机位和光线中至少三项明显不同。` : '';
  const prompt = `你是商业图片工作流的提示词总监。先理解用户素材与任务，再为${targetModel}编写真正可执行的图片提示词。\n\n工具目标：${base}\n素材说明：${String(input.inputHint || `共${images.length}张参考图`).slice(0, 500)}\n用户要求：${note || '采用真实、克制、清晰的商业视觉。'}\n输出数量：${outputCount}\n输出比例：${aspect}${scenePlan}\n\n只输出合法JSON，不要Markdown：{"summary":"对素材、目标和风险的简短理解","prompts":[{"label":"结果名称","prompt":"完整图片提示词"}]}。prompts必须正好${outputCount}项。每条提示词要明确主体身份与保真项、构图、镜头、光线、背景、材质、颜色、文字处理、输出比例和禁止项。不得臆造商品功能、认证、价格、销量或第三方品牌；涉及多张图时必须明确每张参考图的用途。`;
  const requestedProvider = input.textProvider === 'gemini' ? 'gemini' : 'doubao';
  const attempts = requestedProvider === 'gemini'
    ? ['gemini', ...(arkKey ? ['doubao'] : [])]
    : ['doubao', ...(geminiKey ? ['gemini'] : [])];
  const providerFailures = [];
  for (const provider of attempts) {
    try {
      let text;
      let model;
      if (provider === 'gemini') {
        if (!geminiKey) throw Object.assign(new Error('GEMINI_KEY_REQUIRED'), { status: 400, userMessage: '请先填写 Gemini API Key' });
        model = input.geminiTextModel || DEFAULT_GEMINI_TEXT_MODEL;
        text = await geminiText(geminiKey, prompt, images, model, { json: true, maxTokens: 5200 });
      } else {
        if (!arkKey) throw Object.assign(new Error('ARK_KEY_REQUIRED'), { status: 400, userMessage: '请先填写火山方舟 API Key' });
        model = input.visionModel || DEFAULT_VISION_MODEL;
        text = await arkText(arkKey, prompt, images, model, { json: true, temperature: 0.3, maxTokens: 5200 });
      }
      const raw = extractObject(text);
      const prompts = Array.isArray(raw.prompts) ? raw.prompts.slice(0, outputCount).map((item, index) => {
        const role = sceneRoles[index];
        const generated = String(item?.prompt || '').trim();
        return {
          label: String(role ? role.split('：')[0] : item?.label || `结果 ${index + 1}`).slice(0, 50),
          prompt: String(role ? `第${index + 1}张独立图片｜${role}。${generated}\n必须只生成一张完整的单场景照片，不得拼图、分屏或合并多个方案；并与本组其他图片在场景、构图、机位和光线中至少三项不同。` : generated).slice(0, 12000),
        };
      }) : [];
      if (prompts.length !== outputCount || prompts.some(item => !item.prompt)) throw Object.assign(new Error('PROMPT_PLAN_INCOMPLETE'), { userMessage: `${provider === 'gemini' ? 'Gemini' : '火山方舟'}返回的提示词数量不完整` });
      return json(200, {
        summary: String(sceneRoles.length ? `已规划${outputCount}个互不重复的画面目标。${raw.summary || ''}` : raw.summary || '已完成素材理解与提示词规划').slice(0, 500),
        prompts,
        model,
        provider,
        fallback: provider !== requestedProvider,
      });
    } catch (error) {
      providerFailures.push(providerFailure(provider, error));
    }
  }
  const error = combinedProviderError(requestedProvider, providerFailures, '提示词生成暂时未完成');
  return failure(error.status, error.userMessage, error.message, id, { providerFailures: error.providerFailures });
}

async function toolText(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const toolId = String(input.toolId || '');
  const systemPrompt = TEXT_TOOLS[toolId];
  if (!systemPrompt) return failure(400, '不支持该文本工具', 'TOOL_NOT_SUPPORTED', id);
  const note = String(input.note || '').trim().slice(0, 6000);
  const images = imageList(input, 3);
  if (!note && !images.length) return failure(400, '请填写任务信息或上传参考图', 'TOOL_INPUT_REQUIRED', id);
  const taskPrompt = `${systemPrompt}\n\n用户资料：${note || '请依据参考图完成任务。'}\n\n请使用清晰的中文小标题与列表直接给出成品，不解释思考过程。`;
  if (input.textProvider === 'gemini') {
    if (!geminiKey) return failure(400, '请先填写 Gemini API Key，或把文字模型切换为豆包', 'GEMINI_KEY_REQUIRED', id);
    try {
      const model = input.geminiTextModel || DEFAULT_GEMINI_TEXT_MODEL;
      return json(200, { text: await geminiText(geminiKey, taskPrompt, images, model), model, provider: 'gemini' });
    } catch (error) { return failure(error.status || 502, error.userMessage || 'Gemini文字模型暂时未完成', error.message || 'GEMINI_TEXT_FAILED', id); }
  }
  if (!arkKey) return failure(400, '请先填写火山方舟 API Key，或把文字模型切换为Gemini', 'ARK_KEY_REQUIRED', id);
  const model = images.length
    ? cleanModelId(input.visionModel) || DEFAULT_VISION_MODEL
    : cleanModelId(input.arkTextModel) || cleanModelId(input.visionModel) || DEFAULT_VISION_MODEL;
  const content = [{ type: 'text', text: taskPrompt }];
  for (const image of images) content.push({ type: 'image_url', image_url: { url: normalizeImage(image) } });
  const response = await timedFetch(ARK_CHAT_URL, {
    method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
    body: JSON.stringify({ model, messages: [{ role: 'user', content }], temperature: 0.55, max_tokens: 2600 }),
  }, 90000);
  const payload = await remoteJSON(response, 'ARK_CHAT');
  if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); return failure(mapped.status, mapped.message, mapped.code, id); }
  const text = messageText(payload.choices?.[0]?.message?.content).trim();
  if (!text) return failure(502, '文本工具未返回内容，请重试', 'TOOL_TEXT_EMPTY', id);
  return json(200, { text, model, provider: 'doubao' });
}

async function connectionTest(request, input, id) {
  const provider = String(input.provider || '');
  try {
    if (provider === 'gemini') {
      const key = String(request.headers.get('x-gemini-key') || '').trim();
      if (!key) return failure(400, '未填写 Gemini API Key', 'GEMINI_KEY_REQUIRED', id);
      const model = input.geminiTextModel || DEFAULT_GEMINI_TEXT_MODEL;
      const result = await geminiText(key, '只回复两个字：通过', [], model);
      return json(200, { ok: Boolean(result), provider, model, message: 'Gemini 文字与提示词连接正常' });
    }
    if (provider === 'doubao') {
      const key = String(request.headers.get('x-ark-key') || '').trim();
      if (!key) return failure(400, '未填写火山方舟 API Key', 'ARK_KEY_REQUIRED', id);
      const model = cleanModelId(input.arkTextModel) || cleanModelId(input.visionModel) || DEFAULT_VISION_MODEL;
      const result = await arkText(key, '只回复两个字：通过', [], model, { temperature: 0, maxTokens: 32, timeoutMs: 30000 });
      const label = String(model).toLowerCase().includes('deepseek') ? 'DeepSeek' : '火山方舟文字模型';
      return json(200, { ok: Boolean(result), provider, model, message: `${label}连接正常；视觉理解与 Seedream 需分别验证` });
    }
    if (provider === 'openai') {
      const key = String(request.headers.get('x-openai-key') || '').trim();
      if (!key) return failure(400, '未填写 OpenAI API Key', 'OPENAI_KEY_REQUIRED', id);
      const model = input.openaiImageModel || DEFAULT_OPENAI_IMAGE_MODEL;
      const response = await timedFetch(`${OPENAI_MODELS_URL}/${encodeURIComponent(model)}`, { headers: { Authorization: `Bearer ${key}` } }, 30000);
      const payload = await remoteJSON(response, 'OPENAI_MODELS');
      if (!response.ok) throw upstreamError(payload, response.status, 'OpenAI：');
      return json(200, { ok: true, provider, model: payload?.id || model, message: 'OpenAI 密钥与图片模型权限正常' });
    }
    return failure(400, '不支持该连接测试', 'PROVIDER_NOT_SUPPORTED', id);
  } catch (error) {
    return failure(error.status || 502, error.userMessage || '连接测试失败', error.message || 'CONNECTION_TEST_FAILED', id);
  }
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
  const openaiKey = String(request.headers.get('x-openai-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const provider = ['seedream', 'openai', 'gemini'].includes(input.provider) ? input.provider : 'seedream';
  if (!input.prompt || !input.imageBase64) return failure(400, '缺少白底提示词或商品图片', 'WHITE_INPUT_REQUIRED', id);
  try {
    const result = await imageWithFallback(provider, { ark: arkKey, openai: openaiKey, gemini: geminiKey }, [input.imageBase64], input.prompt, 'square', input, true);
    return json(200, { ...result, isBaseImage: true });
  } catch (error) { return failure(error.status || 502, error.userMessage || '白底基准图暂时未完成', error.message || 'WHITE_IMAGE_FAILED', id); }
}
async function seriesImage(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const openaiKey = String(request.headers.get('x-openai-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const provider = ['seedream', 'openai', 'gemini'].includes(input.provider) ? input.provider : 'seedream';
  if (!input.prompt || !input.whiteImageBase64) return failure(400, '缺少提示词或白底参考图', 'SERIES_INPUT_REQUIRED', id);
  const aspect = input.aspect === 'vertical' ? 'vertical' : 'square';
  try {
    return json(200, await imageWithFallback(provider, { ark: arkKey, openai: openaiKey, gemini: geminiKey }, [input.whiteImageBase64], input.prompt, aspect, input, true));
  } catch (error) { return failure(error.status || 502, error.userMessage || '所选图片模型暂时未完成生成', error.message || 'SERIES_IMAGE_FAILED', id); }
}
async function qc(request, input, id) {
  const arkKey = String(request.headers.get('x-ark-key') || '').trim();
  const geminiKey = String(request.headers.get('x-gemini-key') || '').trim();
  const textProvider = input.textProvider === 'gemini' ? 'gemini' : 'doubao';
  if (textProvider === 'gemini' && !geminiKey) return failure(400, '请先填写 Gemini API Key，或把文字模型切换为豆包', 'GEMINI_KEY_REQUIRED', id);
  if (textProvider === 'doubao' && !arkKey) return failure(400, '请先填写火山方舟 API Key，或把文字模型切换为Gemini', 'ARK_KEY_REQUIRED', id);
  if (!input.whiteImageBase64 || !input.generatedImageBase64) return failure(400, '缺少质检对比图片', 'QC_IMAGES_REQUIRED', id);
  const platform = ['taobao', 'pdd', '1688'].includes(input.platform) ? input.platform : 'taobao';
  const prompt = `你是中国大陆电商商品图质检员。第1张图是商品白底基准图，第2张图是待检生成图。任务：${String(input.taskLabel || '商品图').slice(0, 40)}。平台要求：${PLATFORM_RULES[platform]}\n\n严格检查商品形状、比例、颜色、材质、包装结构、标签与商标位置、配件数量；检查复制、增减结构、错误使用、畸形手部、新文字、价格、二维码、水印、其他品牌Logo或虚构宣传。只输出合法JSON：{"pass":true,"score":0,"summary":"不超过40字中文结论","correction":"不通过时给图片模型的不超过180字精准修改要求，通过则为空"}。只有评分不低于80且没有商品失真或违规文字时才能通过。`;
  let raw;
  if (textProvider === 'gemini') {
    try { raw = extractObject(await geminiText(geminiKey, prompt, [input.whiteImageBase64, input.generatedImageBase64], input.geminiTextModel, { json: true, maxTokens: 800 })); }
    catch (error) { return failure(error.status || 502, error.userMessage || 'Gemini自动质检暂时无法完成', error.message || 'GEMINI_QC_FAILED', id); }
  } else {
    const response = await timedFetch(ARK_CHAT_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${arkKey}` },
      body: JSON.stringify({ model: input.visionModel || DEFAULT_VISION_MODEL, messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: normalizeImage(input.whiteImageBase64) } }, { type: 'image_url', image_url: { url: normalizeImage(input.generatedImageBase64) } }] }], temperature: 0.1, max_tokens: 800, response_format: { type: 'json_object' } }),
    }, 90000);
    const payload = await remoteJSON(response, 'ARK_QC');
    if (!response.ok) { const mapped = classify(remoteMessage(payload), response.status); return failure(mapped.status, '自动质检暂时无法完成', mapped.code, id); }
    raw = extractObject(messageText(payload.choices?.[0]?.message?.content));
  }
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
    if (endpoint === 'tool-prompt') return await toolPrompt(request, input, id);
    if (endpoint === 'tool-image') return await toolImage(request, input, id);
    if (endpoint === 'tool-text') return await toolText(request, input, id);
    if (endpoint === 'connection-test') return await connectionTest(request, input, id);
    return failure(404, '接口不存在', 'NOT_FOUND', id);
  } catch (error) {
    if (error.message === 'BAD_JSON') return failure(400, '请求格式错误', 'BAD_JSON', id);
    const mapped = classify(error);
    return failure(mapped.status, mapped.message, mapped.code, id);
  }
}
