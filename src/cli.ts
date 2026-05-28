/**
 * appshot — CLI for the App Shot Editor skill.
 *
 * Bundled (with shot-dsl inlined) into dist/appshot.mjs by scripts/build-skill.mjs,
 * so it runs self-contained inside any app's repo:
 *
 *   APPSHOTEDITOR_TOKEN=ase_…  node dist/appshot.mjs upload shots/*.png
 *   node dist/appshot.mjs publish plan.json
 *
 * Commands:
 *   upload <files...>   Upload source screenshots; prints a JSON asset manifest
 *                       ({ id, url, width, height, filename }) the model uses to write a plan.
 *   compose <plan.json> Run composeTemplate and print the validated Template JSON (no network).
 *   publish <plan.json> Compose + create a handoff; prints the editor import URL.
 */
import { readFileSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { composeTemplate, validateTemplate, type ComposePlan } from '@appshoteditor/shot-dsl';

const BASE = (process.env.APPSHOTEDITOR_URL ?? 'https://appshoteditor.com').replace(/\/$/, '');
const TOKEN = process.env.APPSHOTEDITOR_TOKEN;

function fail(message: string): never {
	console.error(`appshot: ${message}`);
	process.exit(1);
}

function authHeaders(): Record<string, string> {
	if (!TOKEN) {
		fail('APPSHOTEDITOR_TOKEN is not set. Sign in at ' + BASE + '/account and generate a token.');
	}
	return { Authorization: `Bearer ${TOKEN}` };
}

function contentType(file: string): string {
	const ext = extname(file).toLowerCase();
	if (ext === '.png') return 'image/png';
	if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
	if (ext === '.webp') return 'image/webp';
	return 'application/octet-stream';
}

/** Minimal PNG/JPEG natural-dimension reader (the composer needs screenshot sizes). */
function imageSize(buf: Buffer): { width: number; height: number } | null {
	if (buf.length >= 24 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
		return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
	}
	if (buf.length >= 4 && buf[0] === 0xff && buf[1] === 0xd8) {
		let off = 2;
		while (off + 9 < buf.length) {
			if (buf[off] !== 0xff) {
				off++;
				continue;
			}
			const marker = buf[off + 1];
			const len = buf.readUInt16BE(off + 2);
			const isSOF = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
			if (isSOF) {
				return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
			}
			off += 2 + len;
		}
	}
	return null;
}

async function upload(files: string[]): Promise<void> {
	if (files.length === 0) fail('upload: provide one or more image files');
	const headers = authHeaders();
	const assets = [];
	for (const file of files) {
		const buf = readFileSync(file);
		const dims = imageSize(buf);
		const form = new FormData();
		form.append('file', new Blob([buf], { type: contentType(file) }), basename(file));
		if (dims) {
			form.append('width', String(dims.width));
			form.append('height', String(dims.height));
		}
		const res = await fetch(`${BASE}/api/screenshots`, { method: 'POST', headers, body: form });
		if (res.status === 413) fail(`storage quota exceeded uploading ${file}`);
		if (!res.ok) fail(`upload failed for ${file}: ${res.status} ${await res.text()}`);
		const { asset } = (await res.json()) as { asset: Record<string, unknown> };
		assets.push({ ...asset, filename: basename(file) });
	}
	console.log(JSON.stringify({ assets }, null, 2));
}

function readPlan(path: string): ComposePlan {
	if (!path) fail('expected a plan.json path');
	return JSON.parse(readFileSync(path, 'utf8')) as ComposePlan;
}

function buildTemplate(plan: ComposePlan) {
	const template = composeTemplate(plan);
	const result = validateTemplate(template);
	if (!result.valid) fail(`composed template is invalid: ${result.errors.join('; ')}`);
	return template;
}

function compose(planPath: string): void {
	console.log(JSON.stringify(buildTemplate(readPlan(planPath))));
}

async function publish(planPath: string): Promise<void> {
	const template = buildTemplate(readPlan(planPath));
	const res = await fetch(`${BASE}/api/handoffs`, {
		method: 'POST',
		headers: { ...authHeaders(), 'content-type': 'application/json' },
		body: JSON.stringify({ template })
	});
	if (!res.ok) fail(`handoff failed: ${res.status} ${await res.text()}`);
	const { url } = (await res.json()) as { url: string };
	console.log(url);
}

const [command, ...args] = process.argv.slice(2);
switch (command) {
	case 'upload':
		await upload(args);
		break;
	case 'compose':
		compose(args[0]);
		break;
	case 'publish':
		await publish(args[0]);
		break;
	default:
		console.error('Usage: appshot <upload files… | compose plan.json | publish plan.json>');
		process.exit(1);
}
