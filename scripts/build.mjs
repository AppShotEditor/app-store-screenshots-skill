// Bundle src/cli.ts (with @appshoteditor/shot-dsl inlined) into a single
// self-contained file that ships as dist/appshot.mjs.
//
//   node scripts/build.mjs
//
// Re-run whenever @appshoteditor/shot-dsl is updated (bump the dep in package.json
// + npm install + rebuild). The DSL `schemaVersion` is the compatibility contract.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

await build({
	entryPoints: [resolve(root, 'src/cli.ts')],
	outfile: resolve(root, 'dist/appshot.mjs'),
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node22',
	banner: { js: '#!/usr/bin/env node' },
	logLevel: 'info'
});

console.log('✓ Built dist/appshot.mjs');
