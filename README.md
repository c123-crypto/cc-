# 造图台 · AI 商品图片工作台

面向中国大陆淘宝、拼多多和 1688 卖家的商品套图生成工具。上传一张普通商品实拍图，系统会完成商品理解、平台提示词规划、白底基准图、系列图生成、逐张质检、不合格自动重做和整套 ZIP 下载。

## V2 核心流程

1. 豆包视觉模型识别真实商品，并按目标平台生成结构化提示词。
2. 豆包 Seedream 制作保真白底基准图。
3. 系列图优先使用 OpenAI 图片编辑；失败时自动改用豆包 Seedream。
4. 豆包视觉模型逐张对照白底图质检，低于 80 分或存在商品失真时自动重做一次。
5. 五图或十图完成后，自动保存到浏览器历史并支持整套 ZIP 下载。

## 套图数量

- **五张商品套图**：1 张白底主图 + 4 张正方形系列图。
- **五张详情图**：白底图仅作为内部保真参考，输出 5 张 2:3 竖版详情图。
- **十张完整系列**：1 张白底主图 + 4 张正方形系列图 + 5 张 2:3 竖版详情图。

## 功能

- 最多 20 个商品项目并行运行，切换项目不打断后台任务。
- 淘宝、拼多多、1688 三套独立视觉策略。
- 标准转化、生活场景、材质细节、采购展示四种套图方向。
- OpenAI 优先、豆包自动备用，并显示每张图实际使用的引擎。
- 自动检查商品形状、颜色、数量、结构、标签、乱码、违规文案和平台适配。
- 支持单张重做、单张下载、整套 ZIP 下载和 IndexedDB 历史记录。
- API Key 仅保存在当前浏览器 `localStorage`，服务端只在单次请求中临时接收。
- PC 与手机响应式界面。

## 技术栈

- Node.js 18.18+ 原生 HTTP 服务
- 原生 HTML / CSS / JavaScript 单页应用
- 浏览器 IndexedDB + localStorage
- 火山方舟 Chat Completions、Seedream Images Generations
- OpenAI Images Edits（`multipart/form-data`）
- JSZip（随 npm 依赖本地提供，不依赖外部 CDN）

## 本地运行

```bash
unzip ai-image-workbench.zip
cd ai-image-workbench
npm install
npm start
```

浏览器打开：`http://localhost:3000`

健康检查：`http://localhost:3000/health`

## API 设置

进入网页后点击右上角设置：

- **火山方舟 API Key（必填）**：商品理解、Seedream 白底图、备用图片生成和自动质检。
- **OpenAI API Key（选填）**：填写后优先使用 OpenAI 生成系列图。
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
| `/health` | GET | 服务健康检查 |

请求密钥头：

```text
X-Ark-Key: 火山方舟 API Key
X-OpenAI-Key: OpenAI API Key（选填）
```

## 部署建议

用户没有 ICP 备案时，可部署到香港、新加坡、日本或其他海外 Node.js 主机，并绑定自己的域名和 HTTPS。中国大陆用户使用时，不建议把 `chatgpt.site` 或必须嵌入其他平台的页面作为正式入口。

部署平台必须支持：

- Node.js 18.18+
- 长请求超时至少 4 分钟
- 单个请求体至少 40 MB
- 出站访问 `ark.cn-beijing.volces.com` 与 `api.openai.com`

## 文件结构

```text
ai-image-workbench/
├── server.js
├── package.json
├── package-lock.json
├── README.md
└── public/
    └── index.html
```
