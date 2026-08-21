import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const html = await readFile(new URL('../public/index.html', import.meta.url), 'utf8');

test('multi-source tools expose role-specific upload contracts', () => {
  for (const toolId of [
    'viral-remake',
    'detail-remake',
    'background-swap',
    'subject-replace',
    'ai-model',
    'virtual-tryon',
    'portrait-background',
    'shoe-tryon',
    'face-swap',
    'logo-swap',
  ]) {
    assert.match(html, new RegExp(`'${toolId}':\\{[^\\n]+roleUploads:`), `${toolId} should define role uploads`);
  }
});

test('role upload UI validates each required group and preserves batch targets', () => {
  assert.match(html, /function handleToolRoleUpload\(/);
  assert.match(html, /function removeToolRoleFile\(/);
  assert.match(html, /const missing=tool\.roleUploads\.find/);
  assert.match(html, /if\(tool\.roleOutput\)/);
  assert.match(html, /targets\.map\(target=>tool\.roleUploads\.flatMap/);
});

test('reference guidance prohibits copying third-party brand assets', () => {
  assert.match(html, /不复制参考图中的品牌、Logo、文字或受保护元素/);
  assert.match(html, /不复制参考图中的品牌、Logo、文案或受保护元素/);
});

test('Ark connection testing falls back to the official browser API after Cloudflare 525', () => {
  assert.match(html, /async function directArkConnectionTest\(\)/);
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3\/chat\/completions/);
  assert.match(html, /includes\('HTTP 525'\)/);
  assert.match(html, /已绕开 Cloudflare 525/);
});

test('image tools keep working when online prompt planning is unavailable', () => {
  assert.match(html, /function localToolPromptPlan\(tool\)/);
  assert.match(html, /在线提示词模型不可用，已使用本地专业模板/);
  assert.match(html, /state\.settings\.openaiKey\?'openai'/);
});

test('Seedream image generation can bypass Cloudflare and call Ark directly', () => {
  assert.match(html, /async function directSeedreamImage\(images,prompt,aspect\)/);
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3\/images\/generations/);
  assert.match(html, /state\.settings\.arkKey\?'seedream'/);
});

test('image tools create visible queued jobs with lifecycle states', () => {
  assert.match(html, /生成项目与任务/);
  assert.match(html, /function ensureToolJob\(tool\)/);
  assert.match(html, /素材已上传，待生成提示词/);
  assert.match(html, /提示词已生成，待确认生图/);
  assert.match(html, /生成失败，可进入任务重试/);
  assert.match(html, /function selectToolJob\(id\)/);
});

test('queued image jobs use product-operation-sequence names', () => {
  assert.match(html, /sourceNames:\[\]/);
  assert.match(html, /'cutout':'抠图'/);
  assert.match(html, /String\(sequence\)\.padStart\(2,'0'\)/);
  assert.match(html, /`\$\{product\}-\$\{operation\}-\$\{String\(sequence\)/);
});

test('completed tool images are cached for one day and downloadable as a named ZIP', () => {
  assert.match(html, /const HISTORY_TTL=24\*60\*60\*1000/);
  assert.match(html, /expiresAt:Date\.now\(\)\+HISTORY_TTL/);
  assert.match(html, /async function pruneHistory\(\)/);
  assert.match(html, /async function downloadToolZip\(\)/);
  assert.match(html, /`\$\{name\}\.zip`/);
  assert.match(html, /下载任务 ZIP/);
});

test('users can select a persistent download folder with a safe browser fallback', () => {
  assert.match(html, /window\.showDirectoryPicker/);
  assert.match(html, /idbPrefPut\('downloadFolder',handle\)/);
  assert.match(html, /async function saveDownloadedFile\(blob,name\)/);
  assert.match(html, /固定文件夹暂不可写，已改用浏览器下载/);
  assert.match(html, /选择固定文件夹/);
});

test('the catalog uses a light sunny youth palette', () => {
  assert.match(html, /晴空·柠檬/);
  assert.match(html, /Sunny youth palette/);
  assert.match(html, /#fff4c9,#dff5ff/);
});
