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
  assert.match(html, /async function proxyImageBlob\(src\)/);
  assert.match(html, /\/api\/download-image/);
  assert.match(html, /image:await cacheImageSource\(image\)/);
  assert.match(html, /function safeDownloadName\(name\)/);
});

test('users can select a persistent download folder with a safe browser fallback', () => {
  assert.match(html, /window\.showDirectoryPicker/);
  assert.match(html, /idbPrefPut\('downloadFolder',handle\)/);
  assert.match(html, /async function saveDownloadedFile\(blob,name,subfolder='其他下载'\)/);
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
  assert.match(html, /referenceImageBase64:projectMode\(p\)==='main'&&p\.direction==='reference'/);
  assert.match(html, /先上传场景参考图/);
  assert.match(html, /productImages:\[\]/);
  assert.match(html, /styleImages:\[\]/);
  assert.match(html, /商品证据图（必填）/);
  assert.match(html, /场景 \/ 风格参考（选填）/);
  assert.match(html, /productImagesBase64s:productImages/);
  assert.match(html, /styleImagesBase64s:styleImages/);
  assert.match(html, /function projectGenerationContext\(p,index\)/);
  assert.match(html, /function projectGenerationRefs\(p,index\)/);
  assert.match(html, /本次模型实际收到 \$\{unique\.length\} 张参考图/);
  assert.match(html, /实际发送：\$\{labels\.join\('\s*\+\s*'\)\}/);
  assert.match(html, /参考配方：\$\{esc\(s\.referenceRecipe\.join\('\s*\+\s*'\)\)\}/);
  assert.match(html, /productImagesBase64s:projectProductImages\(p\)/);
  assert.match(html, /referenceImagesBase64s:refs/);
});

test('suite projects can use every output slot for a different scene', () => {
  assert.match(html, /includeWhite:false/);
  assert.match(html, /6张场景主图（推荐）/);
  assert.match(html, /含 3 张统一背景变化图/);
  assert.match(html, /function setIncludeWhite\(value\)/);
  assert.match(html, /includeWhite:projectNeedsWhiteMaster\(p\)/);
  assert.match(html, /const MAIN_SCENE_OUTPUT_LABELS=/);
  assert.match(html, /同背景真实使用/);
  assert.match(html, /if\(hasWhiteOutput\)\{/);
  assert.match(html, /p\.phase=hasWhiteOutput\?'正在根据已确认提示词制作白底主图':'正在生成全部场景套图'/);
});

test('suite project names come from AI product understanding instead of upload filenames', () => {
  assert.match(html, /待识别商品 项目/);
  assert.match(html, /function updateProjectNameFromAnalysis\(p,analysis\)/);
  assert.match(html, /product_name/);
  assert.doesNotMatch(html, /p\.name=valid\[0\]\.name/);
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

test('main image suites contain six images and downloads use date and project folders', () => {
  assert.match(html, /square:'6 张商品主图'/);
  assert.match(html, /'taobao-suite':\{minFiles:1,maxFiles:6,outputCount:6/);
  assert.match(html, /输出6张淘宝套图/);
  assert.match(html, /国内电商套图已升级/);
  assert.match(html, /6张主图 · 4张详情 · 10张完整系列/);
  assert.match(html, /提示词 → 生图 · 四模型可选/);
  assert.match(html, /function downloadDayFolder\(date=new Date\(\)\)/);
  assert.match(html, /function downloadProjectFolder\(name,number=''\)/);
  assert.match(html, /getDirectoryHandle\(dayName,\{create:true\}\)/);
  assert.match(html, /getDirectoryHandle\(safeFolder,\{create:true\}\)/);
  assert.doesNotMatch(html, /5张正方形/);
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

test('multi-image jobs share one visual system while keeping scene roles distinct', () => {
  assert.match(html, /function seriesStyleContract\(note/);
  assert.match(html, /整套统一视觉合同/);
  assert.match(html, /只允许画面任务、商品摆位和机位按分镜变化/);
  assert.match(html, /toolSession\.seriesStyle=data\.series_style/);
  assert.match(html, /p\.seriesStyle=String\(analysis\.series_style/);
});

test('latest user constraints are enforced for first generation and single-image redo', () => {
  assert.match(html, /function userHardConstraints\(note/);
  assert.match(html, /用户最高优先级硬性要求/);
  assert.match(html, /这些内容是制作指令，严禁作为画面文字/);
  assert.match(html, /最终覆盖指令（最高优先级）/);
  assert.match(html, /appliedRedoPrompt:extra/);
  assert.match(html, /userNote:p\.userNote/);
  assert.match(html, /userNote:toolSession\.note/);
});

test('single-image redo puts the latest instruction last and makes removal terms absolute', () => {
  assert.match(html, /function redoPriorityRule\(value\)/);
  assert.match(html, /去掉、不要、移除、删除、禁止、改成、只保留/);
  assert.match(html, /\$\{task\.finalRequirement\}/);
  assert.match(html, /redoImageBase64:original\.rawImage\|\|original\.image/);
  assert.match(html, /appliedRedoPrompt:extra/);
  assert.match(html, /参考图1是当前待修改图片/);
  assert.match(html, /本次重新编写后的完整执行要求/);
  assert.doesNotMatch(html, /以下原方案仅作次级上下文：\$\{basePrompt\}/);
  assert.match(html, /\$\{redoPrompt\}\$\{task\.finalRequirement/);
  assert.match(html, /\$\{PRODUCT_REALISM_LOCK\}\\n\$\{finalRequirement\}/);
});

test('six-image main suites mix buyer copy with one clean scene instead of returning all-text-free images', () => {
  assert.match(html, /function projectMainBuyerCopy\(p,item,index\)/);
  assert.match(html, /散乱小物，一盒收好/);
  assert.match(html, /透明可视，取用更快/);
  assert.match(html, /copyManuallyEdited\?buyerFacingCopy/);
  assert.match(html, /if\(strategy\.mode==='clean'\)return \{headline:'',subheadline:''\}/);
  assert.match(html, /const copy=projectMainBuyerCopy\(p,item,index\),headline=compactBuyerHeadline/);
});

test('the text model writes buyer copy automatically before image generation', () => {
  assert.match(html, /AI文字模型已分析买家文案/);
  assert.match(html, /你无需逐张填写；输入框仅供可选微调/);
  assert.match(html, /只有“同背景真实使用”纯场景图允许标题为空/);
  assert.match(html, /其他主图必须生成4—14字买家主标题/);
  assert.doesNotMatch(html, /item\?\.headline\|\|local\.series\[index\]\?\.headline\|\|roles\[index\]/);
});

test('single-image redo controls the webpage copy layer as well as the image model', () => {
  assert.match(html, /function projectCopyPresentation\(item\)/);
  assert.match(html, /保留文字、去掉文字背景/);
  assert.match(html, /presentation==='none'/);
  assert.match(html, /const removeCopy=!removesBackground&&/);
  assert.match(html, /return removeCopy\?'none':'transparent'/);
  assert.doesNotMatch(html, /rgba\(255,253,250,\.98\)/);
  assert.match(html, /function chooseCanvasCopyZone\(ctx,width,height\)/);
  assert.match(html, /function compactBuyerHeadline\(value,max=12\)/);
  assert.match(html, /const zone=chooseCanvasCopyZone\(ctx,width,height\)/);
  assert.doesNotMatch(html, /const pillW=/);
  assert.match(html, /copyManuallyEdited\?buyerFacingCopy\(item\?\.headline,16\)/);
});

test('finished images use buyer-facing copy and never expose workflow labels or sequence counters', () => {
  assert.match(html, /function buyerFacingCopy\(value/);
  assert.match(html, /买家可见文案/);
  assert.doesNotMatch(html, /ctx\.fillText\(`DETAIL /);
  assert.doesNotMatch(html, /ctx\.fillText\(`\$\{String\(index\+1\)\.padStart\(2,'0'\)\} \/ 06`/);
  assert.doesNotMatch(html, /统一商品母版 · 精确数量排版 · 图片可逐个核对/);
  assert.doesNotMatch(html, /单个规格：请核对商品资料/);
  assert.match(html, /已收到商品证据图\|商品外观以原图\|商品证据图\|场景参考图/);
});

test('SKU cards respect chosen background, exact dimensions and buyer selling points', () => {
  assert.match(html, /skuBackground:'auto'/);
  assert.match(html, /skuDimensions:''/);
  assert.match(html, /skuSellingPoint:''/);
  assert.match(html, /function skuVisualTheme\(p\)/);
  assert.match(html, /黑色背景/);
  assert.match(html, /买家主卖点/);
  assert.match(html, /商品长宽高/);
  assert.match(html, /composeSkuCanvas\(p\.whiteImage,specs\[index\],p\.analysis,index,p\)/);
  assert.match(html, /function whiteBackdropCutout\(img\)/);
  assert.match(html, /transparentProduct\?whiteBackdropCutout\(img\):img/);
  assert.match(html, /ctx\.fillText\(`\$\{quantity\}个装`,58,116\)/);
  assert.match(html, /高透可视｜分类拿取更方便/);
  assert.doesNotMatch(html, /globalCompositeOperation='multiply'/);
  assert.doesNotMatch(html, /const stage=/);
  assert.doesNotMatch(html, /canvasRoundRect\(ctx,34,34,1012,1012,30\)/);
});

test('generated thumbnails open a focused preview window', () => {
  assert.match(html, /id="image-preview-modal"/);
  assert.match(html, /function openImagePreview\(src,title/);
  assert.match(html, /function closeImagePreview\(\)/);
  assert.match(html, /onclick="openImagePreview\('/);
  assert.match(html, />预览大图<\/button>/);
});

test('quality-control uncertainty keeps the generated image available for review', () => {
  assert.match(html, /const firstGeneratedCandidate=/);
  assert.match(html, /review_required:true/);
  assert.match(html, /已保留首次成图供预览/);
  assert.match(html, /自动质检暂时未完成，请人工预览核对/);
  assert.doesNotMatch(html, /item\.image=''; item\.status='error'; item\.rejected=true/);
});
