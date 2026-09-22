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
 *   whoami                 Verify APPSHOTEDITOR_TOKEN works (and show plan + storage). Run this FIRST.
 *   upload <files...>      Upload source screenshots; prints a JSON asset manifest
 *                          ({ id, url, width, height, filename }) the model uses to write a plan.
 *   lint <plan.json...>    Validate + compose (no network) and print copy/composition warnings.
 *   compose <plan.json>    Compose and print the validated Template JSON (no network).
 *   variants <plan.json> [--out dir] [--force]
 *                          Write 3 concept plans (plan-A Framed, plan-B Frameless, plan-C Panorama);
 *                          never overwrites the input, existing outputs only with --force.
 *   publish <plan.json...> | publish --variants <plan.json> [--only B,C]
 *                          Compose + create one handoff per plan (or per A/B/C concept); prints the
 *                          editor import URL(s); failures are reported per plan with a retry hint.
 * `lint`, `compose` and `publish` print warnings to stderr; `--strict` turns them into errors.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, extname, join, resolve } from 'node:path';
import {
	COMPOSE_BLEEDS,
	COMPOSE_FONTS,
	COMPOSE_LAYOUTS,
	COMPOSE_PRESENTATIONS,
	composeSet,
	getDeviceFrame,
	isUploadedScreenshotSrc,
	makeVariants,
	validateTemplate,
	type ComposePlan,
	type ComposeWarning
} from '@appshoteditor/shot-dsl';

const BASE = (process.env.APPSHOTEDITOR_URL ?? 'https://appshoteditor.com').replace(/\/$/, '');
const TOKEN = process.env.APPSHOTEDITOR_TOKEN;

function fail(message: string): never {
	console.error(`appshot: ${message}`);
	process.exit(1);
}

/** Guidance shown whenever there's no usable token — covers the first-time (no account) case. */
const ACCOUNT_HELP =
	`You need a free appshoteditor.com account.\n` +
	`  1. Open ${BASE}/account and sign in with Google (this creates your account).\n` +
	`  2. Generate an API token there.\n` +
	`  3. export APPSHOTEDITOR_TOKEN=ase_…  then re-run.`;

function authHeaders(): Record<string, string> {
	if (!TOKEN) {
		fail(`APPSHOTEDITOR_TOKEN is not set.\n${ACCOUNT_HELP}`);
	}
	// Declare a same-origin request so SvelteKit's CSRF origin check accepts the
	// multipart upload POST. The API is Bearer-token authed (not cookie-based), so
	// it isn't CSRF-exposed; this just satisfies the framework's form-post guard.
	return { Authorization: `Bearer ${TOKEN}`, Origin: BASE };
}

/**
 * Pre-flight: confirm the token actually works BEFORE the agent does any expensive work
 * (analyzing the codebase, collecting screenshots). GET /api/screenshots is bearer-authed and
 * cheap — 200 returns the user's storage usage; 401 means no/!invalid token (likely no account).
 */
async function whoami(): Promise<void> {
	const headers = authHeaders();
	const res = await fetch(`${BASE}/api/screenshots`, { headers });
	if (res.status === 401) {
		fail(`token rejected (401) by ${BASE}.\n${ACCOUNT_HELP}`);
	}
	if (!res.ok) fail(`could not verify token: ${res.status} ${await res.text()}`);
	const { assets, usage } = (await res.json()) as {
		assets: unknown[];
		usage?: { usedBytes: number; tier: string };
	};
	const usedMB = ((usage?.usedBytes ?? 0) / (1024 * 1024)).toFixed(1);
	console.log(
		`✓ Token valid — ${BASE}\n` +
			`  plan: ${usage?.tier ?? 'free'}\n` +
			`  storage used: ${usedMB} MB\n` +
			`  screenshots: ${assets?.length ?? 0}`
	);
}

function contentType(file: string): string {
	const ext = extname(file).toLowerCase();
	if (ext === '.png') return 'image/png';
	if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
	if (ext === '.webp') return 'image/webp';
	return 'application/octet-stream';
}

/** Minimal PNG/JPEG/WebP natural-dimension reader (the composer needs screenshot sizes). */
function imageSize(buf: Buffer): { width: number; height: number } | null {
	if (buf.length >= 24 && buf[0] === 0x89 && buf.toString('ascii', 1, 4) === 'PNG') {
		return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
	}
	if (buf.length >= 30 && buf.toString('ascii', 0, 4) === 'RIFF' && buf.toString('ascii', 8, 12) === 'WEBP') {
		const fourCC = buf.toString('ascii', 12, 16);
		if (fourCC === 'VP8X') {
			// Extended: 24-bit little-endian canvas width/height minus one.
			return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
		}
		if (fourCC === 'VP8 ' && buf[23] === 0x9d && buf[24] === 0x01 && buf[25] === 0x2a) {
			// Lossy: 14-bit dims after the frame tag + sync code.
			return { width: buf.readUInt16LE(26) & 0x3fff, height: buf.readUInt16LE(28) & 0x3fff };
		}
		if (fourCC === 'VP8L' && buf[20] === 0x2f) {
			// Lossless: 14-bit width-1 then 14-bit height-1 after the signature byte.
			const bits = buf.readUInt32LE(21);
			return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
		}
		return null;
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

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

const MAX_RETRIES = 3;
/** Per-attempt request timeout; a timeout counts as a (retryable) network error. */
const FETCH_TIMEOUT_MS = Number(process.env.APPSHOTEDITOR_TIMEOUT_MS) > 0 ? Number(process.env.APPSHOTEDITOR_TIMEOUT_MS) : 30_000;
const TRANSIENT_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * POST with automatic retry (up to MAX_RETRIES) on transient failures: 429 (honouring Retry-After,
 * each wait capped at 60 s), 5xx gateway/server errors and network errors — including a request
 * that gets no response within FETCH_TIMEOUT_MS (exponential backoff 1 s, 2 s, 4 s). A network error
 * that survives the retries is thrown as a plain Error message.
 */
async function postWithRetry(url: string, init: RequestInit): Promise<Response> {
	for (let attempt = 1; ; attempt++) {
		let res: Response;
		// A ref'd timer (AbortSignal.timeout's is unref'd and wouldn't keep a hung process alive to retry).
		const controller = new AbortController();
		const timer = setTimeout(() => controller.abort(new DOMException('request timed out', 'TimeoutError')), FETCH_TIMEOUT_MS);
		try {
			res = await fetch(url, { ...init, signal: controller.signal });
		} catch (err) {
			const e = err as Error;
			const reason = e?.name === 'TimeoutError' ? `no response within ${FETCH_TIMEOUT_MS / 1000}s` : e?.message || String(err);
			if (attempt > MAX_RETRIES) throw new Error(`network error talking to ${BASE}: ${reason}`);
			const wait = 2 ** (attempt - 1);
			console.error(`appshot: network error (${reason}) — retrying in ${wait}s (retry ${attempt}/${MAX_RETRIES})`);
			await sleep(wait * 1000);
			continue;
		} finally {
			clearTimeout(timer);
		}
		if (!TRANSIENT_STATUS.has(res.status) || attempt > MAX_RETRIES) return res;
		let waitSeconds = 2 ** (attempt - 1);
		if (res.status === 429) {
			const retryAfter = Number(res.headers.get('retry-after'));
			waitSeconds = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5, 60);
		}
		console.error(`appshot: server returned ${res.status} — waiting ${waitSeconds}s (retry ${attempt}/${MAX_RETRIES})`);
		await sleep(waitSeconds * 1000);
	}
}

function mb(bytes: number): string {
	return (bytes / (1024 * 1024)).toFixed(1);
}

/**
 * Turn an upload error response into an actionable message. 413 is NOT always the
 * storage quota: the server also 413s a single file over the per-file cap — the
 * body's `error` field distinguishes them.
 */
function explainUploadError(file: string, status: number, bodyText: string): string {
	let body: { error?: string; usedBytes?: number; quotaBytes?: number } = {};
	try {
		body = JSON.parse(bodyText) as typeof body;
	} catch {
		/* non-JSON body — fall through to the generic message */
	}
	switch (body.error) {
		case 'file_too_large':
			return `${file} exceeds the 15 MB per-file limit — export a smaller image. (This is not a storage-quota problem.)`;
		case 'quota_exceeded': {
			const used = body.usedBytes != null ? `${mb(body.usedBytes)} MB used` : 'quota full';
			const quota = body.quotaBytes != null ? ` of ${mb(body.quotaBytes)} MB` : '';
			return (
				`storage quota exceeded uploading ${file} (${used}${quota}). ` +
				`Delete unused screenshots at ${BASE}/account or upgrade your plan.`
			);
		}
		case 'unsupported_type':
			return `${file}: unsupported image type — use PNG, JPEG, or WebP.`;
		case 'rate_limited':
			return `rate limited uploading ${file} and retries were exhausted — wait a minute and re-run (already-uploaded files are skipped automatically).`;
		default:
			return `upload failed for ${file}: ${status} ${bodyText}`;
	}
}

async function upload(files: string[]): Promise<void> {
	if (files.length === 0) fail('upload: provide one or more image files');
	const headers = authHeaders();

	// A re-run after a mid-batch failure must not re-upload files that already made it
	// up (duplicate assets eat quota) — match existing assets on filename + byte size.
	const existingByKey = new Map<string, Record<string, unknown>>();
	const listRes = await fetch(`${BASE}/api/screenshots`, { headers });
	if (listRes.ok) {
		const { assets: existing } = (await listRes.json()) as {
			assets: Array<{ filename: string | null; byteSize: number } & Record<string, unknown>>;
		};
		for (const asset of existing) {
			if (asset.filename) existingByKey.set(`${asset.filename} ${asset.byteSize}`, asset);
		}
	} else {
		console.error(
			`appshot: warning — could not check existing uploads (${listRes.status}); duplicates may be re-uploaded`
		);
	}

	const assets: Record<string, unknown>[] = [];
	const flushPartialManifest = (): void => {
		if (assets.length === 0) return;
		console.error(
			`appshot: ${assets.length}/${files.length} files are already stored — partial manifest below; ` +
				`re-running the same command skips them.`
		);
		console.log(JSON.stringify({ assets, partial: true }, null, 2));
	};

	for (const file of files) {
		const name = basename(file);
		const buf = readFileSync(file);

		const already = existingByKey.get(`${name} ${buf.length}`);
		if (already) {
			console.error(`appshot: skipping ${name} — already uploaded (same filename + size)`);
			assets.push({ ...already, filename: name });
			continue;
		}

		const dims = imageSize(buf);
		if (!dims) {
			console.error(
				`appshot: warning — could not read dimensions from ${name}; ` +
					`fill in screenshot.width/height in the plan manually.`
			);
		}
		const form = new FormData();
		form.append('file', new Blob([buf], { type: contentType(file) }), name);
		if (dims) {
			form.append('width', String(dims.width));
			form.append('height', String(dims.height));
		}
		const res = await postWithRetry(`${BASE}/api/screenshots`, { method: 'POST', headers, body: form });
		if (!res.ok) {
			flushPartialManifest();
			fail(explainUploadError(file, res.status, await res.text()));
		}
		const { asset } = (await res.json()) as { asset: Record<string, unknown> };
		assets.push({ ...asset, filename: name });
	}
	console.log(JSON.stringify({ assets }, null, 2));
}

const SCREEN_KEYS = new Set([
	'headline',
	'headlineColor',
	'subheadline',
	'subheadlineColor',
	'layout',
	'background',
	'deviceId',
	'screenshot',
	'focus',
	'crop',
	'presentation',
	'tilt',
	'badge'
]);
const PLAN_KEYS = new Set(['name', 'screens', 'canvasWidth', 'canvasHeight', 'style']);
const STYLE_KEYS = new Set(['presentation', 'tilt', 'tiltScreens', 'bleed', 'palette', 'panorama', 'font']);
const HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

/**
 * Validate a plan against schema/plan.schema.json's rules (hand-rolled — the bundle stays
 * dependency-free). Returns human-readable problems; empty ⇒ valid.
 */
function validatePlan(plan: unknown): string[] {
	const errors: string[] = [];
	const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
	const optString = (v: unknown, at: string) => {
		if (v !== undefined && typeof v !== 'string') errors.push(`${at} must be a string`);
	};
	const posNumber = (v: unknown, at: string) => {
		if (typeof v !== 'number' || !Number.isFinite(v) || v <= 0) errors.push(`${at} must be a positive number`);
	};

	const fraction = (v: unknown, at: string) => {
		if (typeof v !== 'number' || !Number.isFinite(v) || v < 0 || v > 1) errors.push(`${at} must be a number from 0 to 1`);
	};
	const tiltValue = (v: unknown, at: string) => {
		if (typeof v !== 'number' || !Number.isFinite(v) || Math.abs(v) > 30) errors.push(`${at} must be a number of degrees from -30 to 30`);
	};

	if (!isObj(plan)) return ['plan must be a JSON object'];
	for (const key of Object.keys(plan)) if (!PLAN_KEYS.has(key)) errors.push(`unknown plan field "${key}"`);
	const screenCount = Array.isArray(plan.screens) ? plan.screens.length : 0;
	const index = (v: unknown, at: string) => {
		if (!Number.isInteger(v) || (v as number) < 0 || (v as number) >= screenCount) {
			errors.push(`${at} must be a screen index from 0 to ${screenCount - 1}`);
		}
	};
	let hasPalette = false;
	if (plan.style !== undefined) {
		const style = plan.style;
		if (!isObj(style)) {
			errors.push('style must be an object');
		} else {
			for (const key of Object.keys(style)) if (!STYLE_KEYS.has(key)) errors.push(`unknown style field "${key}"`);
			if (style.presentation !== undefined && !(COMPOSE_PRESENTATIONS as readonly unknown[]).includes(style.presentation)) {
				errors.push(`style.presentation must be one of ${COMPOSE_PRESENTATIONS.join(', ')}`);
			}
			if (style.bleed !== undefined && !(COMPOSE_BLEEDS as readonly unknown[]).includes(style.bleed)) {
				errors.push(`style.bleed must be one of ${COMPOSE_BLEEDS.join(', ')}`);
			}
			if (style.tilt !== undefined) tiltValue(style.tilt, 'style.tilt');
			if (style.tiltScreens !== undefined) {
				if (!Array.isArray(style.tiltScreens)) errors.push('style.tiltScreens must be an array of screen indices');
				else style.tiltScreens.forEach((v, k) => index(v, `style.tiltScreens[${k}]`));
			}
			if (style.font !== undefined && !COMPOSE_FONTS.includes(style.font as string)) {
				errors.push(`style.font must be one of: ${COMPOSE_FONTS.join(', ')}`);
			}
			if (style.palette !== undefined) {
				const pal = style.palette;
				if (!isObj(pal) || !['family', 'sequence'].includes(pal.mode as string)) {
					errors.push('style.palette must be { mode: "family" | "sequence", colors: [hex…] }');
				} else if (!Array.isArray(pal.colors) || pal.colors.length === 0 || !pal.colors.every((c) => typeof c === 'string' && HEX.test(c))) {
					errors.push('style.palette.colors must be a non-empty array of #rgb / #rrggbb hex colors');
				} else {
					hasPalette = true;
				}
				if (isObj(pal)) for (const key of Object.keys(pal)) if (!['mode', 'colors'].includes(key)) errors.push(`unknown style.palette field "${key}"`);
			}
			if (style.panorama !== undefined) {
				const pano = style.panorama;
				if (!isObj(pano) || !Array.isArray(pano.spans)) {
					errors.push('style.panorama must be { spans: [[i, i+1], …], straddle?, decoration? }');
				} else {
					for (const key of Object.keys(pano)) if (!['spans', 'straddle', 'decoration'].includes(key)) errors.push(`unknown style.panorama field "${key}"`);
					const seen = new Set<number>();
					pano.spans.forEach((span, k) => {
						const at = `style.panorama.spans[${k}]`;
						if (!Array.isArray(span) || span.length < 2) {
							errors.push(`${at} must list at least 2 adjacent screen indices`);
							return;
						}
						span.forEach((v, j) => {
							index(v, `${at}[${j}]`);
							if (j > 0 && v !== span[j - 1] + 1) errors.push(`${at} must be adjacent ascending indices (e.g. [0, 1])`);
							if (seen.has(v as number)) errors.push(`${at}: screen ${v} is already in another span`);
							seen.add(v as number);
						});
					});
					if (Array.isArray(pano.straddle)) {
						const starts = new Set(pano.spans.map((span) => (Array.isArray(span) ? span[0] : undefined)));
						pano.straddle.forEach((v, k) => {
							if (!starts.has(v)) errors.push(`style.panorama.straddle[${k}] must be the first screen index of a span`);
						});
					} else if (pano.straddle !== undefined && typeof pano.straddle !== 'boolean') {
						errors.push('style.panorama.straddle must be true/false or a list of span-start screen indices');
					}
					if (pano.decoration !== undefined && !['orbs', 'none'].includes(pano.decoration as string)) {
						errors.push('style.panorama.decoration must be "orbs" or "none"');
					}
				}
			}
		}
	}
	if (typeof plan.name !== 'string' || !plan.name) errors.push('name must be a non-empty string');
	if (plan.canvasWidth !== undefined) posNumber(plan.canvasWidth, 'canvasWidth');
	if (plan.canvasHeight !== undefined) posNumber(plan.canvasHeight, 'canvasHeight');
	if ((plan.canvasWidth === undefined) !== (plan.canvasHeight === undefined)) {
		errors.push('set both canvasWidth and canvasHeight, or (recommended) omit both');
	}
	if (!Array.isArray(plan.screens) || plan.screens.length === 0) {
		errors.push('screens must be a non-empty array');
		return errors;
	}
	plan.screens.forEach((screen, i) => {
		const at = `screens[${i}]`;
		if (!isObj(screen)) {
			errors.push(`${at} must be an object`);
			return;
		}
		for (const key of Object.keys(screen)) if (!SCREEN_KEYS.has(key)) errors.push(`${at}: unknown field "${key}"`);
		if (typeof screen.headline !== 'string' || !screen.headline.trim()) {
			errors.push(`${at}.headline must be a non-empty string`);
		}
		optString(screen.headlineColor, `${at}.headlineColor`);
		optString(screen.subheadline, `${at}.subheadline`);
		optString(screen.subheadlineColor, `${at}.subheadlineColor`);
		if (screen.layout !== undefined && !(COMPOSE_LAYOUTS as readonly unknown[]).includes(screen.layout)) {
			errors.push(`${at}.layout must be one of ${COMPOSE_LAYOUTS.join(', ')} (got ${JSON.stringify(screen.layout)})`);
		}
		if (typeof screen.deviceId !== 'string' || !getDeviceFrame(screen.deviceId)) {
			errors.push(`${at}.deviceId ${JSON.stringify(screen.deviceId)} is not a known device id`);
		}
		if (!isObj(screen.screenshot)) {
			errors.push(`${at}.screenshot must be an object { url, width, height }`);
		} else {
			if (!isUploadedScreenshotSrc(screen.screenshot.url)) {
				errors.push(`${at}.screenshot.url must be an uploaded-asset URL from the upload manifest (/api/screenshots/<id>/raw)`);
			}
			posNumber(screen.screenshot.width, `${at}.screenshot.width`);
			posNumber(screen.screenshot.height, `${at}.screenshot.height`);
		}
		if (screen.background === undefined && hasPalette) {
			// background comes from style.palette
		} else if (!isObj(screen.background) || !['solid', 'gradient'].includes(screen.background.type as string)) {
			errors.push(`${at}.background.type must be "solid" or "gradient" (or omit it and set style.palette)`);
		}
		if (screen.focus !== undefined) {
			if (!isObj(screen.focus)) errors.push(`${at}.focus must be { top, bottom } (fractions of the screenshot height)`);
			else {
				fraction(screen.focus.top, `${at}.focus.top`);
				fraction(screen.focus.bottom, `${at}.focus.bottom`);
				if (typeof screen.focus.top === 'number' && typeof screen.focus.bottom === 'number' && screen.focus.bottom <= screen.focus.top) {
					errors.push(`${at}.focus.bottom must be greater than focus.top`);
				}
			}
		}
		if (screen.crop !== undefined) {
			if (!isObj(screen.crop)) errors.push(`${at}.crop must be { x, y, w, h } (fractions of the screenshot)`);
			else {
				for (const k of ['x', 'y', 'w', 'h']) fraction(screen.crop[k], `${at}.crop.${k}`);
				const c = screen.crop as Record<string, number>;
				if (c.w <= 0 || c.h <= 0) errors.push(`${at}.crop.w and crop.h must be greater than 0`);
				if (c.x + c.w > 1.0001 || c.y + c.h > 1.0001) errors.push(`${at}.crop must stay inside the screenshot (x + w ≤ 1, y + h ≤ 1)`);
			}
		}
		if (screen.presentation !== undefined && !(COMPOSE_PRESENTATIONS as readonly unknown[]).includes(screen.presentation)) {
			errors.push(`${at}.presentation must be one of ${COMPOSE_PRESENTATIONS.join(', ')}`);
		}
		if (screen.tilt !== undefined) tiltValue(screen.tilt, `${at}.tilt`);
		if (screen.badge !== undefined && (typeof screen.badge !== 'string' || !screen.badge.trim() || screen.badge.length > 40)) {
			errors.push(`${at}.badge must be a short non-empty string (≤ 40 chars)`);
		}
	});
	return errors;
}

function readPlan(path: string): ComposePlan {
	if (!path) fail('expected a plan.json path');
	let plan: unknown;
	try {
		plan = JSON.parse(readFileSync(path, 'utf8'));
	} catch (err) {
		fail(`could not read ${path}: ${(err as Error).message}`);
	}
	const errors = validatePlan(plan);
	if (errors.length) fail(`invalid plan (${path}):\n  - ${errors.join('\n  - ')}`);
	return plan as ComposePlan;
}

/** Compose + validate; prints lint warnings (stderr). `--strict` makes any warning fatal. */
function buildTemplate(plan: ComposePlan, opts: { strict: boolean; label?: string }) {
	let composed: ReturnType<typeof composeSet>;
	try {
		composed = composeSet(plan);
	} catch (err) {
		fail(`${opts.label ? `${opts.label}: ` : ''}could not compose: ${(err as Error).message}`);
	}
	const { template, report } = composed;
	const result = validateTemplate(template);
	if (!result.valid) fail(`composed template is invalid: ${result.errors.join('; ')}`);
	printWarnings(report.warnings, opts.label);
	if (opts.strict && report.warnings.length > 0) {
		fail(`${opts.label ? `${opts.label}: ` : ''}${report.warnings.length} warning(s) with --strict — fix the plan and re-run`);
	}
	return template;
}

function safeCompose(plan: ComposePlan, label: string): ReturnType<typeof composeSet> {
	try {
		return composeSet(plan);
	} catch (err) {
		fail(`${label}: could not compose: ${(err as Error).message}`);
	}
}

function printWarnings(warnings: ComposeWarning[], label?: string): void {
	for (const w of warnings) console.error(`appshot: warning${label ? ` (${label})` : ''} [${w.code}] ${w.message}`);
}

/** Split argv into positional args and flags. */
function parseArgs(argv: string[]): {
	positional: string[];
	strict: boolean;
	variants: boolean;
	force: boolean;
	out?: string;
	only?: string[];
} {
	const positional: string[] = [];
	let strict = false;
	let variants = false;
	let force = false;
	let out: string | undefined;
	let only: string[] | undefined;
	for (let i = 0; i < argv.length; i++) {
		const a = argv[i];
		if (a === '--strict') strict = true;
		else if (a === '--variants') variants = true;
		else if (a === '--force') force = true;
		else if (a === '--out') {
			out = argv[++i];
			if (!out) fail('--out needs a directory');
		} else if (a === '--only') {
			const list = argv[++i];
			if (!list) fail('--only needs a comma-separated list, e.g. --only B,C');
			only = list.split(',').map((k) => k.trim().toUpperCase()).filter(Boolean);
			if (only.length === 0) fail('--only needs at least one concept, e.g. --only B,C');
		} else if (a.startsWith('--')) fail(`unknown flag ${a}`);
		else positional.push(a);
	}
	return { positional, strict, variants, force, out, only };
}

function compose(argv: string[]): void {
	const { positional, strict } = parseArgs(argv);
	if (positional.length !== 1) fail('compose takes exactly one plan.json');
	console.log(JSON.stringify(buildTemplate(readPlan(positional[0]), { strict })));
}

/** Same checks as `publish` (plan validation → compose → validateTemplate), without the network. */
function lint(argv: string[]): void {
	const { positional, strict } = parseArgs(argv);
	if (positional.length === 0) fail('lint: provide one or more plan.json files');
	let warningsTotal = 0;
	let invalid = 0;
	for (const path of positional) {
		const plan = readPlan(path);
		const { template, report } = safeCompose(plan, path);
		const result = validateTemplate(template);
		const label = positional.length > 1 ? basename(path) : undefined;
		printWarnings(report.warnings, label);
		warningsTotal += report.warnings.length;
		if (!result.valid) {
			invalid++;
			console.log(`${basename(path)}: INVALID — ${result.errors.join('; ')}`);
		} else {
			console.log(`${basename(path)}: ${report.warnings.length === 0 ? 'OK — no warnings' : `valid, ${report.warnings.length} warning(s)`}`);
		}
	}
	if (invalid > 0 || (strict && warningsTotal > 0)) process.exit(1);
}

/**
 * Write plan-A/B/C.json. Never overwrites its own input; refuses to replace existing outputs
 * without --force; with --strict, any composition warning aborts before anything is written.
 */
function variants(argv: string[]): void {
	const { positional, out, strict, force } = parseArgs(argv);
	if (positional.length !== 1) fail('variants takes exactly one plan.json');
	const input = resolve(positional[0]);
	const plan = readPlan(positional[0]);
	const dir = resolve(out ?? dirname(positional[0]));
	const outputs = makeVariants(plan).map((v) => ({ v, file: join(dir, `plan-${v.key}.json`) }));
	const self = outputs.find((o) => o.file === input);
	if (self) fail(`refusing to overwrite the input plan ${input} — pass --out <another dir> (or rename the input)`);
	const existing = outputs.filter((o) => existsSync(o.file)).map((o) => o.file);
	if (existing.length && !force) fail(`refusing to overwrite existing ${existing.join(', ')} — pass --force to replace them`);
	const composed = outputs.map((o) => ({ ...o, report: safeCompose(o.v.plan, `plan-${o.v.key}`).report }));
	for (const c of composed) {
		const result = validateTemplate(safeCompose(c.v.plan, `plan-${c.v.key}`).template);
		if (!result.valid) fail(`plan-${c.v.key}: composed template is invalid: ${result.errors.join('; ')}`);
	}
	if (strict) {
		const warned = composed.filter((c) => c.report.warnings.length > 0);
		for (const c of warned) printWarnings(c.report.warnings, `plan-${c.v.key}`);
		if (warned.length) fail(`${warned.map((c) => `plan-${c.v.key}`).join(', ')} have warnings with --strict — nothing written; fix the base plan and re-run`);
	}
	mkdirSync(dir, { recursive: true });
	for (const c of composed) {
		writeFileSync(c.file, JSON.stringify(c.v.plan, null, 2) + '\n');
		console.log(`${c.file}  (${c.v.key} ${c.v.label}, ${c.report.warnings.length} warning(s))`);
	}
}

/** POSIX-shell-quote a path for a copy-pasteable command (plain paths stay unquoted). */
function shellQuote(value: string): string {
	return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}

type HandoffResult = { ok: true; url: string } | { ok: false; error: string };

async function postHandoff(template: unknown): Promise<HandoffResult> {
	try {
		const res = await postWithRetry(`${BASE}/api/handoffs`, {
			method: 'POST',
			headers: { ...authHeaders(), 'content-type': 'application/json' },
			body: JSON.stringify({ template })
		});
		if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 300)}` };
		const { url } = (await res.json()) as { url: string };
		return { ok: true, url };
	} catch (err) {
		return { ok: false, error: (err as Error)?.message || String(err) };
	}
}

/**
 * publish plan.json…            one handoff per plan
 * publish --variants plan.json  one handoff per concept (A, B, C); `--only B,C` publishes a subset
 * Every plan is read, composed and validated BEFORE the first network call. Each handoff then
 * succeeds or fails on its own; a summary lists what was published and how to retry the rest.
 */
async function publish(argv: string[]): Promise<void> {
	const { positional, strict, variants: asVariants, only } = parseArgs(argv);
	if (positional.length === 0) fail('publish: provide one or more plan.json files');
	const jobs: Array<{ key: string; label: string; template: ReturnType<typeof buildTemplate> }> = [];
	if (asVariants) {
		if (positional.length !== 1) fail('publish --variants takes exactly one plan.json');
		const all = makeVariants(readPlan(positional[0]));
		const unknown = (only ?? []).filter((k) => !all.some((v) => v.key === k));
		if (unknown.length) fail(`--only: unknown concept(s) ${unknown.join(', ')} — use A, B and/or C`);
		for (const v of all) {
			if (only && !only.includes(v.key)) continue;
			const label = `${v.key} ${v.label}`;
			jobs.push({ key: v.key, label, template: buildTemplate(v.plan, { strict, label }) });
		}
	} else {
		if (only) fail('--only works with --variants; to retry specific plans, pass just those plan files');
		for (const path of positional) {
			const label = basename(path);
			jobs.push({ key: path, label, template: buildTemplate(readPlan(path), { strict, label: positional.length > 1 ? label : undefined }) });
		}
	}
	if (jobs.length === 1) {
		const r = await postHandoff(jobs[0].template);
		if (!r.ok) fail(`handoff failed${positional.length > 1 || asVariants ? ` (${jobs[0].label})` : ''}: ${r.error}`);
		console.log(r.url);
		return;
	}
	const failed: typeof jobs = [];
	for (const job of jobs) {
		const r = await postHandoff(job.template);
		if (r.ok) console.log(`${job.label}: ${r.url}`);
		else {
			failed.push(job);
			console.error(`appshot: ${job.label}: FAILED — ${r.error}`);
		}
	}
	if (failed.length) {
		const done = jobs.filter((j) => !failed.includes(j)).map((j) => j.label);
		console.error(`appshot: published ${done.length ? done.join(', ') : 'nothing'}; NOT published: ${failed.map((j) => j.label).join(', ')}`);
		const retry = asVariants
			? `appshot publish --variants ${shellQuote(positional[0])} --only ${failed.map((j) => j.key).join(',')}`
			: `appshot publish ${failed.map((j) => shellQuote(j.key)).join(' ')}`;
		console.error(`appshot: retry only the missing ones with: ${retry}`);
		process.exit(1);
	}
}

const [command, ...args] = process.argv.slice(2);
// Never surface a raw stack trace: anything unexpected becomes a one-line `appshot:` error.
process.on('unhandledRejection', (err) => fail((err as Error)?.message || String(err)));
try {
	switch (command) {
		case 'whoami':
			await whoami();
			break;
		case 'upload':
			await upload(args);
			break;
		case 'lint':
			lint(args);
			break;
		case 'compose':
			compose(args);
			break;
		case 'variants':
			variants(args);
			break;
		case 'publish':
			await publish(args);
			break;
		default:
			console.error(
				'Usage: appshot <whoami | upload files… | lint plan.json… [--strict] | compose plan.json [--strict] |\n' +
					'               variants plan.json [--out dir] [--force] [--strict] |\n' +
					'               publish plan.json… [--strict] | publish --variants plan.json [--only A,B,C] [--strict]>'
			);
			process.exit(1);
	}
} catch (err) {
	fail((err as Error)?.message || String(err));
}
