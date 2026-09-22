// Bundle src/cli.ts (with @appshoteditor/shot-dsl inlined) into a single
// self-contained file that ships as dist/appshot.mjs.
//
//   node scripts/build.mjs
//
// Re-run whenever @appshoteditor/shot-dsl is updated (bump the dep in package.json
// + npm install + rebuild). The DSL `schemaVersion` is the compatibility contract.
//
// Unpublished DSL changes: point SHOT_DSL_PATH at a local checkout of the package
// (the directory containing its package.json) to bundle that source instead of the
// npm copy in node_modules — e.g.
//
//   SHOT_DSL_PATH=../app-shot-editor/packages/shot-dsl node scripts/build.mjs
//
// package.json is untouched, so once that version is published the normal path
// (bump dep + npm install + plain rebuild) takes over again.
//
// OUT=<file> writes the bundle somewhere else (e.g. a scratch path while testing an unreleased
// DSL) instead of the committed dist/appshot.mjs.
import { build } from 'esbuild';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { existsSync, readFileSync } from 'node:fs';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const localDsl = process.env.SHOT_DSL_PATH ? resolve(process.env.SHOT_DSL_PATH) : null;
const dslDir = localDsl ?? resolve(root, 'node_modules/@appshoteditor/shot-dsl');
if (localDsl && !existsSync(resolve(localDsl, 'src/index.ts'))) {
	throw new Error(`SHOT_DSL_PATH=${localDsl} has no src/index.ts`);
}
const dslVersion = JSON.parse(readFileSync(resolve(dslDir, 'package.json'), 'utf8')).version;
const outfile = process.env.OUT ? resolve(process.env.OUT) : resolve(root, 'dist/appshot.mjs');

await build({
	entryPoints: [resolve(root, 'src/cli.ts')],
	outfile,
	bundle: true,
	platform: 'node',
	format: 'esm',
	target: 'node22',
	banner: { js: `#!/usr/bin/env node\n// @appshoteditor/shot-dsl ${dslVersion}${localDsl ? ' (local source)' : ''}` },
	...(localDsl ? { alias: { '@appshoteditor/shot-dsl': resolve(localDsl, 'src/index.ts') } } : {}),
	logLevel: 'info'
});

console.log(`✓ Built ${outfile} (shot-dsl ${dslVersion} from ${localDsl ?? 'node_modules'})`);
