# AI商品图片工作台

面向中国大陆电商卖家的AI商品图片生成工具。上传一张商品实拍图，自动生成可用于淘宝/拼多多/1688的整套商品图片。

## 功能

- 左侧项目管理（最多6个并行项目）
- 商品实拍图上传（JPG/PNG/WebP，8MB）
- 平台选择（淘宝/拼多多/1688），各平台不同视觉策略
- 套图类型（5张商品套图/5张详情图/10张完整系列）
- 套图方向（标准转化/生活场景/材质细节/采购展示）
- AI四阶段生成：商品理解→白底基准图→系列图→自动质检
- 优先OpenAI编辑，失败自动切豆包Seedream
- 质检评分<80自动重做一次
- IndexedDB历史记录
- 单张下载/整套ZIP打包
- API Key仅存浏览器localStorage，通过请求头传给服务端

## 技术栈

- 后端：Node.js（原生http模块 + form-data）
- 前端：原生HTML/CSS/JS（无框架）
- 存储：IndexedDB（历史记录）+ localStorage（API Key）
- AI API：火山方舟（豆包视觉模型+Seedream）、OpenAI Images Edit
- ZIP：JSZip（CDN动态加载）

## 本地运行

```bash
npm install
npm start
# 默认运行在 http://localhost:3000
```

## API设置

打开页面后点击右上角⚙️设置：

1. **火山方舟 API Key（必填）**：用于商品理解、白底图生成、质检
2. **OpenAI API Key（选填）**：填写后优先使用OpenAI编辑系列图，失败自动切豆包

## API接口

| 接口 | 方法 | 说明 |
|---|---|---|
| `/api/analyze` | POST | 商品理解，输出提示词JSON |
| `/api/white-image` | POST | 生成白底基准图（豆包Seedream） |
| `/api/series-image` | POST | 生成系列图（优先OpenAI，失败切豆包） |
| `/api/qc` | POST | 自动质检（视觉模型对比） |
| `/health` | GET | 健康检查 |

请求头：
- `X-Ark-Key`：火山方舟API Key
- `X-OpenAI-Key`：OpenAI API Key（选填）

## 文件结构

```
ai-image-workbench/
├── server.js          # 后端API服务
├── package.json       # 依赖配置
└── public/
    └── index.html     # 前端工作台界面
```

## 部署

已部署到海外节点（HTTPS），公开链接可直接访问。
