# 造图台 · AI 商品图片工作台

面向中国大陆淘宝、拼多多和 1688 卖家的商品套图生成工具。可上传 1—6 张同一商品的多角度证据图，以及 0—4 张场景/风格参考图；系统先综合理解商品身份，再为每张结果分配不同参考、场景、构图和机位，完成提示词确认、系列图生成、逐张质检、不合格自动重做和整套 ZIP 下载。白底主图为可选项，新项目默认把 5 张全部用于不同场景。

## 核心流程

1. 豆包视觉模型识别真实商品，并按目标平台生成结构化提示词。
2. 用户选择“全部场景图”或“白底主图 + 场景图”；全场景模式会跳过白底生成。
3. 系列图使用用户选择的图片模型，并在可用时自动切换备用模型。
4. 视觉模型逐张对照用户上传的原始商品证据图质检，低于 80 分或存在商品失真时自动重做一次。
5. 五图或十图完成后，自动保存到浏览器历史并支持整套 ZIP 下载。

所有独立图片工具采用统一的两阶段流程：先由 Gemini 3.7 Flash 或豆包 Seed 理解素材并生成结构化提示词；用户检查、修改提示词后，再选择 Seedream 5.0、GPT Image 2 或 Nano Banana 2 生图。不会再把简单描述直接发送给图片模型。

## 套图数量

- **五张商品套图**：默认 5 张全部为不同场景；也可切换为 1 张白底主图 + 4 张场景图。
- **五张详情图**：输出 5 张不同任务的 2:3 竖版场景与卖点图，不占用白底名额。
- **十张完整系列**：默认 10 张全部为不同场景；也可切换为 1 张白底主图 + 9 张场景与详情图。

AI 完成商品理解后，会使用“产品通用名称 + 项目序号”命名项目、历史记录和下载文件，不再沿用上传照片的文件名。

## 多参考图工作流

- **商品证据图**：1—6 张同一商品的正面、侧面、背面、细节、配件或包装，用于锁定真实结构和身份；第 1 张为主基准。
- **场景/风格参考**：最多 4 张，只借鉴环境、构图、机位、光线与色调，不复制其中的商品、品牌或文字。
- **先理解再生图**：视觉模型先输出商品摘要和参考分配策略，再为每张结果生成独立提示词。
- **逐张引用**：每张图都有独立“参考配方”，优先携带 2 张分配到的商品角度和 1 张场景参考；只有缺少场景参考时才补入白底基准，避免白底图压过真实场景。
- **顺序对齐**：系统会把规划阶段的“商品图 2 / 场景图 1”转换成图片模型实际收到的“参考图 1 / 2 / 3”及明确用途，防止编号错位。
- **原图质检**：自动质检优先对照用户上传的原始商品证据图，白底基准仅作辅助，避免基准图自身失真后被继续放大。

## 功能

- 最多 20 个商品项目并行运行，切换项目不打断后台任务。
- 淘宝、拼多多、1688 三套独立视觉策略。
- 标准转化、生活场景、材质细节、采购展示四种套图方向。
- OpenAI 优先、豆包自动备用，并显示每张图实际使用的引擎。
- 自动检查商品形状、颜色、数量、结构、标签、乱码、违规文案和平台适配。
- 支持单张重做、单张下载、整套 ZIP 下载和 IndexedDB 历史记录。
- 直连模型返回的临时图片地址会立即转为本地可下载数据；若浏览器跨域读取失败，会通过受限同源代理安全取回，避免 ZIP 出现 `Failed to fetch`。
- API Key 仅保存在当前浏览器 `localStorage`，服务端只在单次请求中临时接收。
- PC 与手机响应式界面。
- 8 个左侧分类、53 个工具入口；新增文字 AI（文案、标题、翻译、改写、脚本）与多模型生图。
- 每个图片工具都有独立的最少/最多素材数、素材顺序和输出数量规则；拼图支持 2—10 张素材。
- Gemini API 可用于免费额度优先的文字规划和 Nano Banana 生图，实际免费额度以 Google 账户为准。

## 技术栈

- Cloudflare Workers + Vinext / Wrangler
- 原生 HTML / CSS / JavaScript 单页应用
- 浏览器 IndexedDB + localStorage
- 火山方舟 Chat Completions、Seedream Images Generations
- 阿里云百炼千问兼容接口、Qwen3-VL、Qwen Image 3.0
- OpenAI Images Edits（`multipart/form-data`）
- Google Gemini Interactions API（文字与 Nano Banana 图片）
- JSZip（随 npm 依赖本地提供，不依赖外部 CDN）

## 本地运行

```bash
npm install
npm run dev
```

按终端显示的本地地址打开应用。

本地 Cloudflare Worker 调试可运行 `npm run cf:dev`，生产部署运行 `npm run cf:deploy`。

## API 设置

进入网页后点击右上角设置：

- **Gemini API Key（推荐、选填）**：免费额度优先的文字生成、图片提示词规划和 Nano Banana 生图。
- **火山方舟 API Key（选填）**：豆包文字理解、Seedream 生图；原商品套图流水线仍使用它完成白底和质检。
- **OpenAI API Key（选填）**：GPT Image 2 图片生成与编辑。
- **阿里云百炼千问 API Key（选填）**：千问文字、Qwen3-VL 商品理解和 Qwen Image 3.0；API Key、模型与请求地域必须一致。
- **高级模型名称（选填）**：当账号开通的模型名称不同，可直接在设置中覆盖服务器默认值。

不要把真实密钥写入源码、README、环境文件或部署平台的公开变量。

## 可选环境变量

```text
PORT=3000
ARK_CHAT_URL=https://ark.cn-beijing.volces.com/api/v3/chat/completions
ARK_IMAGE_URL=https://ark.cn-beijing.volces.com/api/v3/images/generations
ARK_VISION_MODEL=doubao-seed-2-0-lite-260428
ARK_IMAGE_MODEL=doubao-seedream-5-0-260128
OPENAI_IMAGE_URL=https://api.openai.com/v1/images/edits
OPENAI_IMAGE_MODEL=gpt-image-2
```

模型名称可能因火山方舟账号开通情况而不同。若默认名称不可用，在网页的“高级模型设置”中填写控制台显示的实际 Endpoint/模型 ID。

## 后端接口

| 接口 | 方法 | 作用 |
|---|---|---|
| `/api/analyze` | POST | 商品识别和平台专用提示词规划 |
| `/api/white-image` | POST | Seedream 白底基准图 |
| `/api/series-image` | POST | OpenAI 优先、Seedream 备用的单张系列图 |
| `/api/qc` | POST | 对照白底基准图进行自动质检 |
| `/api/tool-prompt` | POST | 先理解素材并生成可编辑的结构化图片提示词 |
| `/api/tool-image` | POST | 使用选定的 Seedream、GPT Image 或 Nano Banana 生图 |
| `/api/tool-text` | POST | 使用 Gemini 或豆包运行文字工具 |
| `/health` | GET | 服务健康检查 |

请求密钥头：

```text
X-Ark-Key: 火山方舟 API Key
X-OpenAI-Key: OpenAI API Key（选填）
X-Gemini-Key: Gemini API Key（选填）
X-Qwen-Key: 阿里云百炼千问 API Key（选填）
X-Qwen-Endpoint: 百炼地域或工作空间专属地址（选填）
```

## 部署建议

项目已按 Cloudflare Workers 配置。部署前先用 `npm run check` 做语法检查，再用 `npm run cf:deploy` 发布；随后在 Workers 的“域名”页面绑定自定义域名。

运行环境需要允许单个请求体最多 40 MB，并能出站访问火山方舟、阿里云百炼、OpenAI 与 Google Gemini API。API Key 由用户浏览器随单次请求发送，不要写入公开的 Worker 变量或仓库。Cloudflare 到火山方舟或阿里云百炼出现 HTTP 525 时，前端会在用户浏览器中尝试直连官方 API，并在跨域或账号权限仍不满足时给出明确错误。

## 文件结构

```text
ai-image-workbench/
├── app/api/[endpoint]/route.js
├── lib/api.js
├── public/index.html
├── worker.js
├── wrangler.jsonc
├── package.json
└── README.md
```
