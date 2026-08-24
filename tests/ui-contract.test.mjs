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

test('AI product and model studios create practical 1-to-10 multi-scene series', () => {
  assert.match(html, /'product-shot':\{minFiles:1,maxFiles:10,adjustableCount:true/);
  assert.match(html, /function setToolRequestedCount\(value\)/);
  assert.match(html, /Math\.min\(10,toolSession\.requestedCount/);
  assert.match(html, /Array\.from\(\{length:10\}/);
  assert.match(html, /多场景使用图/);
  assert.match(html, /function setToolSceneMode\(value\)/);
  assert.match(html, /function toolSceneRoles\(mode,count\)/);
  assert.match(html, /禁止拼图、分屏、多宫格和多方案合成/);
  assert.match(html, /promptLabel:toolSession\.prompts\[i\]\.label/);
  assert.match(html, /第\$\{i\+1\}张生成失败，已继续下一张/);
});

test('suite projects fall back to editable local prompts when both online planners fail', () => {
  assert.match(html, /function localProjectPromptPlan\(p\)/);
  assert.match(html, /在线模型不可用，已生成本地保真提示词/);
  assert.match(html, /本地模板已就绪/);
  assert.match(html, /error\.providerFailures=Array\.isArray\(json\.providerFailures\)/);
  assert.match(html, /已生成本地可编辑提示词，可继续生图/);
});

test('project prompt planning bypasses Cloudflare Ark 525 before using local templates', () => {
  assert.match(html, /async function directArkProjectPrompts\(p\)/);
  assert.match(html, /function applyProjectPromptPlan\(p,analysis\)/);
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3\/chat\/completions/);
  assert.match(html, /item\.code==='ARK_CHAT_TLS_525'/);
  assert.match(html, /正在改用浏览器直连识图/);
  assert.match(html, /已通过浏览器直连火山完成商品理解和提示词规划/);
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

test('settings can move between computers in a password-encrypted backup', () => {
  assert.match(html, /async function exportSettingsBackup\(\)/);
  assert.match(html, /async function importSettingsBackup\(\)/);
  assert.match(html, /PBKDF2/);
  assert.match(html, /AES-GCM/);
  assert.match(html, /iterations:210000/);
  assert.match(html, /备份内容不会发送到服务器/);
  assert.match(html, /固定下载文件夹需在每台电脑单独授权/);
});

test('suite projects separate product evidence from scene references and require a scene reference for remake', () => {
  assert.match(html, /这套图主要要解决什么/);
  assert.match(html, /平台自动匹配/);
  assert.match(html, /提升点击率/);
  assert.match(html, /提升转化率/);
  assert.match(html, /参考图复刻/);
  assert.match(html, /function handleReferenceUpload\(e\)/);
  assert.match(html, /referenceImageBase64:p\.direction==='reference'/);
  assert.match(html, /先上传场景参考图/);
  assert.match(html, /productImages:\[\]/);
  assert.match(html, /styleImages:\[\]/);
  assert.match(html, /商品证据图（必填）/);
  assert.match(html, /场景 \/ 风格参考（选填）/);
  assert.match(html, /productImagesBase64s:productImages/);
  assert.match(html, /styleImagesBase64s:styleImages/);
  assert.match(html, /function projectGenerationRefs\(p,index\)/);
  assert.match(html, /referenceImagesBase64s:refs/);
});

test('Qwen is available for text, vision, image generation and regional configuration', () => {
  assert.match(html, /千问（Qwen Plus \/ Qwen3-VL）/);
  assert.match(html, /Qwen Image 3\.0/);
  assert.match(html, /id="set-qwen"/);
  assert.match(html, /id="set-qwen-endpoint"/);
  assert.match(html, /dashscope-intl\.aliyuncs\.com/);
  assert.match(html, /qwenVisionModel:state\.settings\.qwenVisionModel/);
  assert.match(html, /qwenImageModel:state\.settings\.qwenImageModel/);
  assert.match(html, /headers\['X-Qwen-Key'\]/);
});

test('all Qwen paths can bypass Cloudflare 525 in the browser', () => {
  assert.match(html, /function isQwenTlsFailure\(error\)/);
  assert.match(html, /async function directQwenText\(prompt,images=\[\],options=\{\}\)/);
  assert.match(html, /async function directQwenToolText\(tool\)/);
  assert.match(html, /async function directQwenToolPrompts\(tool\)/);
  assert.match(html, /async function directQwenProjectPrompts\(p\)/);
  assert.match(html, /async function directQwenImage\(images,prompt,aspect\)/);
  assert.match(html, /async function directQwenQc\(input\)/);
  assert.match(html, /千问浏览器直连正常（已绕开 Cloudflare 525）/);
  assert.match(html, /正在改用浏览器直连 Qwen Image/);
});

test('all Doubao text paths can bypass Cloudflare 525 in the browser', () => {
  assert.match(html, /async function directArkText\(prompt,images=\[\],options=\{\}\)/);
  assert.match(html, /async function directArkToolPrompts\(tool\)/);
  assert.match(html, /async function directArkToolText\(tool\)/);
  assert.match(html, /ark\.cn-beijing\.volces\.com\/api\/v3\/responses/);
  assert.match(html, /已绕开 Cloudflare 525，通过浏览器直连豆包生成提示词/);
  assert.match(html, /async function projectImageCall\(p,path,data,images,aspect\)/);
  assert.match(html, /正在改用浏览器直连生图/);
});

test('unfinished projects and tool jobs are restored from a 24-hour local draft', () => {
  assert.match(html, /async function saveWorkspaceDraft\(\)/);
  assert.match(html, /async function loadWorkspaceDraft\(\)/);
  assert.match(html, /idbPrefPut\('workspaceDraft'/);
  assert.match(html, /Date\.now\(\)-draft\.savedAt>HISTORY_TTL/);
  assert.match(html, /上次操作已中断，可从提示词或生图步骤继续/);
  assert.match(html, /已恢复24小时内的项目草稿和待生成任务/);
  assert.match(html, /visibilitychange/);
  assert.match(html, /草稿保存24小时/);
});

test('encrypted settings import restores Qwen configuration too', () => {
  assert.match(html, /'qwenKey','qwenEndpoint'/);
  assert.match(html, /'qwenTextModel','qwenVisionModel','qwenImageModel'/);
});
