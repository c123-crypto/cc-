import { mkdir, copyFile } from 'node:fs/promises';

await mkdir('dist/.openai', { recursive: true });
await copyFile('.openai/hosting.json', 'dist/.openai/hosting.json');
await mkdir('public/vendor', { recursive: true });
await copyFile('node_modules/jszip/dist/jszip.min.js', 'public/vendor/jszip.min.js');
