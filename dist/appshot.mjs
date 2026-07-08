#!/usr/bin/env node

// src/cli.ts
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

// node_modules/@appshoteditor/shot-dsl/src/types.ts
var CURRENT_SCHEMA_VERSION = 2;

// node_modules/@appshoteditor/shot-dsl/src/validate.ts
var LAYER_TYPES = ["background", "text", "image", "device", "shape"];
function isValidLayerJSON(data) {
  if (!data || typeof data !== "object") return false;
  const obj = data;
  return typeof obj.id === "string" && typeof obj.name === "string" && typeof obj.type === "string" && LAYER_TYPES.includes(obj.type) && typeof obj.visible === "boolean" && typeof obj.locked === "boolean";
}
function isValidScreenLayersJSON(data) {
  if (!data || typeof data !== "object") return false;
  const obj = data;
  return typeof obj.schemaVersion === "number" && Array.isArray(obj.layers) && obj.layers.every(isValidLayerJSON);
}
function generateLayerId() {
  return `layer-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
function validateTemplate(data) {
  const errors = [];
  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Template must be an object"] };
  }
  const t = data;
  if (typeof t.id !== "string" || !t.id) errors.push("id must be a non-empty string");
  if (typeof t.name !== "string" || !t.name) errors.push("name must be a non-empty string");
  if (!Array.isArray(t.screens) || t.screens.length === 0) {
    errors.push("screens must be a non-empty array");
  } else {
    t.screens.forEach((screen, i) => {
      if (!isValidScreenLayersJSON(screen)) {
        errors.push(`screens[${i}] is not a valid screen`);
        return;
      }
      const s = screen;
      if (s.schemaVersion > CURRENT_SCHEMA_VERSION) {
        errors.push(`screens[${i}] has unsupported schemaVersion ${s.schemaVersion}`);
      }
      s.layers.forEach((layer, j) => {
        if (!isValidLayerJSON(layer)) errors.push(`screens[${i}].layers[${j}] is invalid`);
      });
    });
  }
  return { valid: errors.length === 0, errors };
}

// node_modules/@appshoteditor/shot-dsl/src/builders.ts
var DEFAULT_CANVAS_WIDTH = 280;
var DEFAULT_CANVAS_HEIGHT = 600;
function makeTextLayer(opts) {
  const id = opts.id ?? generateLayerId();
  return {
    id,
    name: opts.name ?? "Text",
    type: "text",
    visible: opts.visible ?? true,
    locked: opts.locked ?? false,
    templateRole: opts.templateRole,
    templateKey: opts.templateKey,
    fabricData: {
      type: "Textbox",
      left: opts.left,
      top: opts.top,
      width: opts.width,
      text: opts.text,
      fill: opts.fill ?? "#ffffff",
      fontSize: opts.fontSize ?? 28,
      fontFamily: opts.fontFamily ?? "Inter",
      fontWeight: opts.fontWeight ?? "700",
      textAlign: opts.textAlign ?? "center",
      lineHeight: opts.lineHeight ?? 1.1,
      // Match the editor convention (addText, makeImageLayer, makeShapeLayer all
      // use center origin) so `left`/`top` are the box center, not its corner.
      originX: opts.originX ?? "center",
      originY: opts.originY ?? "center",
      layerId: id,
      layerType: "text"
    }
  };
}
function makeScreen(opts) {
  return {
    schemaVersion: CURRENT_SCHEMA_VERSION,
    canvasWidth: opts.canvasWidth ?? DEFAULT_CANVAS_WIDTH,
    canvasHeight: opts.canvasHeight ?? DEFAULT_CANVAS_HEIGHT,
    deviceClass: opts.deviceClass,
    layers: opts.layers,
    background: opts.background
  };
}
function makeTemplate(opts) {
  return {
    id: opts.id ?? generateLayerId(),
    name: opts.name,
    description: opts.description,
    thumbnail: opts.thumbnail ?? "",
    tags: opts.tags ?? [],
    version: opts.version ?? "1.0.0",
    screens: opts.screens,
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    author: opts.author
  };
}

// node_modules/@appshoteditor/shot-dsl/src/device-frames.ts
var deviceFrames = [
  // -------------------------------------------------------------------------
  // iOS PHONES
  // -------------------------------------------------------------------------
  {
    id: "iphone_16_pro",
    name: "iPhone 16 Pro",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16-pro.webp",
    imageDimensions: { width: 1406, height: 2822 },
    // Screen centered within frame: (1406-1212)/2=97, (2822-2618)/2=102
    screenBounds: { x: 97, y: 100, width: 1212, height: 2624 },
    cornerRadius: 120
    // Adjust to match device screen corners
  },
  {
    id: "iphone_16_pro_max",
    name: "iPhone 16 Pro Max",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16-pro-max.webp",
    imageDimensions: { width: 1520, height: 3068 },
    // Screen centered within frame: (1520-1310)/2=105, (3068-2846)/2=111
    screenBounds: { x: 100, y: 100, width: 1320, height: 2870 },
    cornerRadius: 140
    // Slightly larger than 16 Pro
  },
  {
    id: "iphone_16",
    name: "iPhone 16",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16.webp",
    imageDimensions: { width: 1379, height: 2756 },
    screenBounds: { x: 95, y: 98, width: 1189, height: 2563 },
    cornerRadius: 118
  },
  {
    id: "iphone_16_plus",
    name: "iPhone 16 Plus",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16-plus.webp",
    imageDimensions: { width: 1490, height: 2996 },
    screenBounds: { x: 103, y: 106, width: 1284, height: 2786 },
    cornerRadius: 128
  },
  {
    id: "iphone_17_pro",
    name: "iPhone 17 Pro",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-17-pro.webp",
    imageDimensions: { width: 1406, height: 2822 },
    screenBounds: { x: 97, y: 100, width: 1212, height: 2624 },
    cornerRadius: 120
  },
  {
    id: "iphone_17_pro_max",
    name: "iPhone 17 Pro Max",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-17-pro-max.webp",
    imageDimensions: { width: 1520, height: 3068 },
    screenBounds: { x: 100, y: 100, width: 1320, height: 2870 },
    cornerRadius: 140
  },
  {
    id: "iphone_air",
    name: "iPhone Air",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-air.webp",
    imageDimensions: { width: 1490, height: 2996 },
    screenBounds: { x: 103, y: 106, width: 1284, height: 2786 },
    cornerRadius: 128
  },
  // -------------------------------------------------------------------------
  // ANDROID PHONES
  // -------------------------------------------------------------------------
  {
    id: "pixel_9_pro",
    name: "Google Pixel 9 Pro",
    platform: "android",
    category: "phone",
    frameAsset: "/devices/pixel-9-pro.webp",
    imageDimensions: { width: 1620, height: 3136 },
    screenBounds: { x: 112, y: 111, width: 1396, height: 2916 },
    cornerRadius: 135
  },
  {
    id: "pixel_9_pro_xl",
    name: "Google Pixel 9 Pro XL",
    platform: "android",
    category: "phone",
    frameAsset: "/devices/pixel-9-pro-xl.webp",
    imageDimensions: { width: 1684, height: 3272 },
    screenBounds: { x: 116, y: 116, width: 1452, height: 3043 },
    cornerRadius: 140
  },
  // -------------------------------------------------------------------------
  // iPadOS TABLETS
  // -------------------------------------------------------------------------
  {
    id: "ipad_pro_13_m4",
    name: 'iPad Pro 13" (M4)',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-pro-13-m4.webp",
    imageDimensions: { width: 2264, height: 2952 },
    screenBounds: { x: 100, y: 100, width: 2064, height: 2752 },
    cornerRadius: 40
  },
  {
    id: "ipad_pro_11_m4",
    name: 'iPad Pro 11" (M4)',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-pro-11-m4.webp",
    imageDimensions: { width: 1868, height: 2620 },
    screenBounds: { x: 100, y: 116, width: 1668, height: 2388 },
    cornerRadius: 40
  },
  {
    id: "ipad_air_13",
    name: 'iPad Air 13"',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-air-13.webp",
    imageDimensions: { width: 2248, height: 2932 },
    screenBounds: { x: 100, y: 100, width: 2048, height: 2732 },
    cornerRadius: 40
  },
  {
    id: "ipad_air_11",
    name: 'iPad Air 11"',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-air-11.webp",
    imageDimensions: { width: 1880, height: 2600 },
    screenBounds: { x: 120, y: 120, width: 1640, height: 2360 },
    cornerRadius: 40
  },
  {
    id: "ipad_mini_7",
    name: "iPad mini 7",
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-mini-7.webp",
    imageDimensions: { width: 1888, height: 2666 },
    screenBounds: { x: 200, y: 200, width: 1488, height: 2266 },
    cornerRadius: 40
  },
  // -------------------------------------------------------------------------
  // macOS LAPTOPS
  // -------------------------------------------------------------------------
  {
    id: "macbook_air_13",
    name: 'MacBook Air 13"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-13.webp",
    imageDimensions: { width: 3260, height: 2164 },
    screenBounds: { x: 350, y: 306, width: 2560, height: 1608 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_13_menu_bar",
    name: 'MacBook Air 13" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-13-menu-bar.webp",
    imageDimensions: { width: 3260, height: 2164 },
    screenBounds: { x: 350, y: 312, width: 2560, height: 1602 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_15",
    name: 'MacBook Air 15"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-15.webp",
    imageDimensions: { width: 3580, height: 2364 },
    screenBounds: { x: 350, y: 306, width: 2880, height: 1808 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_15_menu_bar",
    name: 'MacBook Air 15" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-15-menu-bar.webp",
    imageDimensions: { width: 3580, height: 2364 },
    screenBounds: { x: 350, y: 308, width: 2880, height: 1806 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_14",
    name: 'MacBook Pro 14"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-14.webp",
    imageDimensions: { width: 3944, height: 2564 },
    screenBounds: { x: 461, y: 364, width: 3022, height: 1900 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_14_menu_bar",
    name: 'MacBook Pro 14" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-14-menu-bar.webp",
    imageDimensions: { width: 3824, height: 2564 },
    screenBounds: { x: 401, y: 374, width: 3022, height: 1890 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_16",
    name: 'MacBook Pro 16"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-16.webp",
    imageDimensions: { width: 4340, height: 2860 },
    screenBounds: { x: 442, y: 377, width: 3456, height: 2170 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_16_menu_bar",
    name: 'MacBook Pro 16" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-16-menu-bar.webp",
    imageDimensions: { width: 4340, height: 2860 },
    screenBounds: { x: 442, y: 389, width: 3456, height: 2158 },
    cornerRadius: 20
  },
  // -------------------------------------------------------------------------
  // macOS DESKTOPS
  // -------------------------------------------------------------------------
  {
    id: "imac_24",
    name: 'iMac 24"',
    platform: "macos",
    category: "desktop",
    frameAsset: "/devices/imac-24.webp",
    imageDimensions: { width: 4880, height: 5720 },
    screenBounds: { x: 200, y: 1600, width: 4480, height: 2520 },
    cornerRadius: 0
  },
  {
    id: "studio_display",
    name: "Studio Display",
    platform: "macos",
    category: "desktop",
    frameAsset: "/devices/studio-display.webp",
    imageDimensions: { width: 5520, height: 4316 },
    screenBounds: { x: 200, y: 200, width: 5120, height: 2880 },
    cornerRadius: 0
  },
  {
    id: "pro_display_xdr",
    name: "Pro Display XDR",
    platform: "macos",
    category: "desktop",
    frameAsset: "/devices/pro-display-xdr.webp",
    imageDimensions: { width: 6416, height: 4865 },
    screenBounds: { x: 200, y: 200, width: 6016, height: 3384 },
    cornerRadius: 0
  }
];
function getDeviceFrame(id) {
  return deviceFrames.find((d) => d.id === id);
}
function deviceClassForDeviceId(deviceId) {
  const frame = getDeviceFrame(deviceId);
  if (!frame) return null;
  if (frame.platform === "ios") return frame.category === "tablet" ? "ipad_13" : "iphone_6_9";
  if (frame.platform === "android") return "android_phone";
  if (frame.platform === "macos" || frame.platform === "windows") return "macbook";
  return null;
}

// node_modules/@appshoteditor/shot-dsl/src/frames.ts
var DEFAULT_CANVAS_WIDTH2 = 280;
var DEFAULT_CANVAS_HEIGHT2 = 600;
function calculateDeviceScale(device, canvasWidth = DEFAULT_CANVAS_WIDTH2, canvasHeight = DEFAULT_CANVAS_HEIGHT2) {
  const maxWidth = canvasWidth * 0.85;
  const maxHeight = canvasHeight * 0.85;
  return Math.min(
    maxWidth / device.imageDimensions.width,
    maxHeight / device.imageDimensions.height,
    0.15
  );
}
function makeDeviceFrameLayers(opts) {
  const device = getDeviceFrame(opts.deviceId);
  if (!device) throw new Error(`Unknown device: ${opts.deviceId}`);
  const canvasWidth = opts.canvasWidth ?? DEFAULT_CANVAS_WIDTH2;
  const canvasHeight = opts.canvasHeight ?? DEFAULT_CANVAS_HEIGHT2;
  const scale = opts.scale ?? calculateDeviceScale(device, canvasWidth, canvasHeight);
  const frameId = `device-frame-${generateLayerId()}`;
  const screenshotId = generateLayerId();
  const scaledImageWidth = device.imageDimensions.width * scale;
  const scaledImageHeight = device.imageDimensions.height * scale;
  const screenWidth = device.screenBounds.width * scale;
  const screenHeight = device.screenBounds.height * scale;
  const screenOffsetX = device.screenBounds.x * scale;
  const screenOffsetY = device.screenBounds.y * scale;
  const cornerRadius = device.cornerRadius * scale;
  const frameCenterX = opts.centerX ?? canvasWidth / 2;
  const frameCenterY = opts.centerY ?? canvasHeight / 2;
  const screenCenterX = frameCenterX - scaledImageWidth / 2 + screenOffsetX + screenWidth / 2;
  const screenCenterY = frameCenterY - scaledImageHeight / 2 + screenOffsetY + screenHeight / 2;
  const imgScaleX = screenWidth / opts.screenshotWidth;
  const imgScaleY = screenHeight / opts.screenshotHeight;
  const screenshot = {
    id: screenshotId,
    name: opts.name ? `${opts.name} screenshot` : "Screenshot",
    type: "image",
    visible: true,
    locked: false,
    fabricData: {
      type: "image",
      src: opts.screenshotUrl,
      crossOrigin: "anonymous",
      left: screenCenterX,
      top: screenCenterY,
      width: opts.screenshotWidth,
      height: opts.screenshotHeight,
      scaleX: imgScaleX,
      scaleY: imgScaleY,
      originX: "center",
      originY: "center",
      selectable: false,
      evented: false,
      // clipPath is in the image's local (unscaled) coordinate space.
      clipPath: {
        type: "Rect",
        width: opts.screenshotWidth,
        height: opts.screenshotHeight,
        rx: cornerRadius / imgScaleX,
        ry: cornerRadius / imgScaleY,
        left: 0,
        top: 0,
        originX: "center",
        originY: "center"
      },
      layerId: screenshotId,
      layerType: "image",
      deviceFrameId: frameId,
      layerRole: "screenshot",
      deviceId: opts.deviceId,
      screenshotRotation: opts.screenshotRotation ?? 0
    }
  };
  const frame = {
    id: frameId,
    name: opts.name ?? device.name,
    type: "device",
    visible: true,
    locked: false,
    fabricData: {
      type: "image",
      src: device.frameAsset,
      crossOrigin: "anonymous",
      left: frameCenterX,
      top: frameCenterY,
      width: device.imageDimensions.width,
      height: device.imageDimensions.height,
      scaleX: scale,
      scaleY: scale,
      originX: "center",
      originY: "center",
      layerId: frameId,
      layerType: "deviceFrame",
      deviceFrameId: frameId,
      layerRole: "frame",
      deviceId: opts.deviceId,
      deviceScale: scale
    }
  };
  return { screenshot, frame };
}

// node_modules/@appshoteditor/shot-dsl/src/compose.ts
function canvasDimsForDevice(deviceId) {
  switch (getDeviceFrame(deviceId)?.category) {
    case "tablet":
      return { width: 450, height: 600 };
    case "laptop":
    case "desktop":
      return { width: 608, height: 380 };
    case "phone":
    default:
      return { width: 280, height: 608 };
  }
}
function composeTemplate(plan) {
  const screens = plan.screens.map((screen) => {
    const explicit = plan.canvasWidth != null || plan.canvasHeight != null;
    const { width: canvasWidth, height: canvasHeight } = explicit ? { width: plan.canvasWidth ?? 280, height: plan.canvasHeight ?? 600 } : canvasDimsForDevice(screen.deviceId);
    const { screenshot, frame } = makeDeviceFrameLayers({
      deviceId: screen.deviceId,
      screenshotUrl: screen.screenshot.url,
      screenshotWidth: screen.screenshot.width,
      screenshotHeight: screen.screenshot.height,
      canvasWidth,
      canvasHeight,
      centerY: canvasHeight * 0.6
      // sit the device lower, leaving room for the headline
    });
    const headline = makeTextLayer({
      text: screen.headline,
      left: canvasWidth / 2,
      top: canvasHeight * 0.12,
      width: canvasWidth * 0.84,
      fontSize: 26,
      fontWeight: "800",
      fill: screen.headlineColor ?? "#ffffff",
      textAlign: "center",
      name: "Headline",
      templateRole: "editable",
      templateKey: "headline"
    });
    return makeScreen({
      background: screen.background,
      canvasWidth,
      canvasHeight,
      // Tag the device GROUP (multi-device) so a mixed plan lands as separate sidebar groups in
      // the editor instead of relying on frame inference. Absent ⇒ editor infers it.
      deviceClass: deviceClassForDeviceId(screen.deviceId) ?? void 0,
      layers: [screenshot, frame, headline]
    });
  });
  return makeTemplate({ name: plan.name, screens, tags: ["generated"] });
}

// src/cli.ts
var BASE = (process.env.APPSHOTEDITOR_URL ?? "https://appshoteditor.com").replace(/\/$/, "");
var TOKEN = process.env.APPSHOTEDITOR_TOKEN;
function fail(message) {
  console.error(`appshot: ${message}`);
  process.exit(1);
}
var ACCOUNT_HELP = `You need a free appshoteditor.com account.
  1. Open ${BASE}/account and sign in with Google (this creates your account).
  2. Generate an API token there.
  3. export APPSHOTEDITOR_TOKEN=ase_\u2026  then re-run.`;
function authHeaders() {
  if (!TOKEN) {
    fail(`APPSHOTEDITOR_TOKEN is not set.
${ACCOUNT_HELP}`);
  }
  return { Authorization: `Bearer ${TOKEN}`, Origin: BASE };
}
async function whoami() {
  const headers = authHeaders();
  const res = await fetch(`${BASE}/api/screenshots`, { headers });
  if (res.status === 401) {
    fail(`token rejected (401) by ${BASE}.
${ACCOUNT_HELP}`);
  }
  if (!res.ok) fail(`could not verify token: ${res.status} ${await res.text()}`);
  const { assets, usage } = await res.json();
  const usedMB = ((usage?.usedBytes ?? 0) / (1024 * 1024)).toFixed(1);
  console.log(
    `\u2713 Token valid \u2014 ${BASE}
  plan: ${usage?.tier ?? "free"}
  storage used: ${usedMB} MB
  screenshots: ${assets?.length ?? 0}`
  );
}
function contentType(file) {
  const ext = extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".webp") return "image/webp";
  return "application/octet-stream";
}
function imageSize(buf) {
  if (buf.length >= 24 && buf[0] === 137 && buf.toString("ascii", 1, 4) === "PNG") {
    return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
  }
  if (buf.length >= 30 && buf.toString("ascii", 0, 4) === "RIFF" && buf.toString("ascii", 8, 12) === "WEBP") {
    const fourCC = buf.toString("ascii", 12, 16);
    if (fourCC === "VP8X") {
      return { width: 1 + buf.readUIntLE(24, 3), height: 1 + buf.readUIntLE(27, 3) };
    }
    if (fourCC === "VP8 " && buf[23] === 157 && buf[24] === 1 && buf[25] === 42) {
      return { width: buf.readUInt16LE(26) & 16383, height: buf.readUInt16LE(28) & 16383 };
    }
    if (fourCC === "VP8L" && buf[20] === 47) {
      const bits = buf.readUInt32LE(21);
      return { width: (bits & 16383) + 1, height: (bits >> 14 & 16383) + 1 };
    }
    return null;
  }
  if (buf.length >= 4 && buf[0] === 255 && buf[1] === 216) {
    let off = 2;
    while (off + 9 < buf.length) {
      if (buf[off] !== 255) {
        off++;
        continue;
      }
      const marker = buf[off + 1];
      const len = buf.readUInt16BE(off + 2);
      const isSOF = marker >= 192 && marker <= 207 && ![196, 200, 204].includes(marker);
      if (isSOF) {
        return { height: buf.readUInt16BE(off + 5), width: buf.readUInt16BE(off + 7) };
      }
      off += 2 + len;
    }
  }
  return null;
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
var MAX_429_RETRIES = 3;
async function postWithRetry(url, init) {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, init);
    if (res.status !== 429 || attempt > MAX_429_RETRIES) return res;
    const retryAfter = Number(res.headers.get("retry-after"));
    const waitSeconds = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5, 60);
    console.error(`appshot: rate limited (429) \u2014 waiting ${waitSeconds}s (retry ${attempt}/${MAX_429_RETRIES})`);
    await sleep(waitSeconds * 1e3);
  }
}
function mb(bytes) {
  return (bytes / (1024 * 1024)).toFixed(1);
}
function explainUploadError(file, status, bodyText) {
  let body = {};
  try {
    body = JSON.parse(bodyText);
  } catch {
  }
  switch (body.error) {
    case "file_too_large":
      return `${file} exceeds the 15 MB per-file limit \u2014 export a smaller image. (This is not a storage-quota problem.)`;
    case "quota_exceeded": {
      const used = body.usedBytes != null ? `${mb(body.usedBytes)} MB used` : "quota full";
      const quota = body.quotaBytes != null ? ` of ${mb(body.quotaBytes)} MB` : "";
      return `storage quota exceeded uploading ${file} (${used}${quota}). Delete unused screenshots at ${BASE}/account or upgrade your plan.`;
    }
    case "unsupported_type":
      return `${file}: unsupported image type \u2014 use PNG, JPEG, or WebP.`;
    case "rate_limited":
      return `rate limited uploading ${file} and retries were exhausted \u2014 wait a minute and re-run (already-uploaded files are skipped automatically).`;
    default:
      return `upload failed for ${file}: ${status} ${bodyText}`;
  }
}
async function upload(files) {
  if (files.length === 0) fail("upload: provide one or more image files");
  const headers = authHeaders();
  const existingByKey = /* @__PURE__ */ new Map();
  const listRes = await fetch(`${BASE}/api/screenshots`, { headers });
  if (listRes.ok) {
    const { assets: existing } = await listRes.json();
    for (const asset of existing) {
      if (asset.filename) existingByKey.set(`${asset.filename}\0${asset.byteSize}`, asset);
    }
  } else {
    console.error(
      `appshot: warning \u2014 could not check existing uploads (${listRes.status}); duplicates may be re-uploaded`
    );
  }
  const assets = [];
  const flushPartialManifest = () => {
    if (assets.length === 0) return;
    console.error(
      `appshot: ${assets.length}/${files.length} files are already stored \u2014 partial manifest below; re-running the same command skips them.`
    );
    console.log(JSON.stringify({ assets, partial: true }, null, 2));
  };
  for (const file of files) {
    const name = basename(file);
    const buf = readFileSync(file);
    const already = existingByKey.get(`${name}\0${buf.length}`);
    if (already) {
      console.error(`appshot: skipping ${name} \u2014 already uploaded (same filename + size)`);
      assets.push({ ...already, filename: name });
      continue;
    }
    const dims = imageSize(buf);
    if (!dims) {
      console.error(
        `appshot: warning \u2014 could not read dimensions from ${name}; fill in screenshot.width/height in the plan manually.`
      );
    }
    const form = new FormData();
    form.append("file", new Blob([buf], { type: contentType(file) }), name);
    if (dims) {
      form.append("width", String(dims.width));
      form.append("height", String(dims.height));
    }
    const res = await postWithRetry(`${BASE}/api/screenshots`, { method: "POST", headers, body: form });
    if (!res.ok) {
      flushPartialManifest();
      fail(explainUploadError(file, res.status, await res.text()));
    }
    const { asset } = await res.json();
    assets.push({ ...asset, filename: name });
  }
  console.log(JSON.stringify({ assets }, null, 2));
}
function readPlan(path) {
  if (!path) fail("expected a plan.json path");
  return JSON.parse(readFileSync(path, "utf8"));
}
function buildTemplate(plan) {
  const template = composeTemplate(plan);
  const result = validateTemplate(template);
  if (!result.valid) fail(`composed template is invalid: ${result.errors.join("; ")}`);
  return template;
}
function compose(planPath) {
  console.log(JSON.stringify(buildTemplate(readPlan(planPath))));
}
async function publish(planPath) {
  const template = buildTemplate(readPlan(planPath));
  const res = await fetch(`${BASE}/api/handoffs`, {
    method: "POST",
    headers: { ...authHeaders(), "content-type": "application/json" },
    body: JSON.stringify({ template })
  });
  if (!res.ok) fail(`handoff failed: ${res.status} ${await res.text()}`);
  const { url } = await res.json();
  console.log(url);
}
var [command, ...args] = process.argv.slice(2);
switch (command) {
  case "whoami":
    await whoami();
    break;
  case "upload":
    await upload(args);
    break;
  case "compose":
    compose(args[0]);
    break;
  case "publish":
    await publish(args[0]);
    break;
  default:
    console.error("Usage: appshot <whoami | upload files\u2026 | compose plan.json | publish plan.json>");
    process.exit(1);
}
