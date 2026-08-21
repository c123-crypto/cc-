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
