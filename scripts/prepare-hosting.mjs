import { cp, mkdir, copyFile, rm } from 'node:fs/promises';

await mkdir('public/vendor', { recursive: true });
await copyFile('node_modules/jszip/dist/jszip.min.js', 'public/vendor/jszip.min.js');

await rm('dist', { recursive: true, force: true });
await mkdir('dist/.openai', { recursive: true });
await mkdir('dist/server/lib', { recursive: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
await copyFile('worker.js', 'dist/server/index.js');
await copyFile('lib/api.js', 'dist/server/lib/api.js');
await cp('public', 'dist/client', { recursive: true });
