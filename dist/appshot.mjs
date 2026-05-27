#!/usr/bin/env node

// skill/appshot-screenshots/src/cli.ts
import { readFileSync } from "node:fs";
import { basename, extname } from "node:path";

// src/lib/shot-dsl/types.ts
var CURRENT_SCHEMA_VERSION = 2;

// src/lib/shot-dsl/validate.ts
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

// src/lib/shot-dsl/builders.ts
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

// src/lib/device-frames.ts
var deviceFrames = [
  // -------------------------------------------------------------------------
  // iOS PHONES
  // -------------------------------------------------------------------------
  {
    id: "iphone_16_pro",
    name: "iPhone 16 Pro",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16-pro.png",
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
    frameAsset: "/devices/iphone-16-pro-max.png",
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
    frameAsset: "/devices/iphone-16.png",
    imageDimensions: { width: 1379, height: 2756 },
    screenBounds: { x: 95, y: 98, width: 1189, height: 2563 },
    cornerRadius: 118
  },
  {
    id: "iphone_16_plus",
    name: "iPhone 16 Plus",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-16-plus.png",
    imageDimensions: { width: 1490, height: 2996 },
    screenBounds: { x: 103, y: 106, width: 1284, height: 2786 },
    cornerRadius: 128
  },
  {
    id: "iphone_17_pro",
    name: "iPhone 17 Pro",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-17-pro.png",
    imageDimensions: { width: 1406, height: 2822 },
    screenBounds: { x: 97, y: 100, width: 1212, height: 2624 },
    cornerRadius: 120
  },
  {
    id: "iphone_17_pro_max",
    name: "iPhone 17 Pro Max",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-17-pro-max.png",
    imageDimensions: { width: 1520, height: 3068 },
    screenBounds: { x: 100, y: 100, width: 1320, height: 2870 },
    cornerRadius: 140
  },
  {
    id: "iphone_air",
    name: "iPhone Air",
    platform: "ios",
    category: "phone",
    frameAsset: "/devices/iphone-air.png",
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
    frameAsset: "/devices/pixel-9-pro.png",
    imageDimensions: { width: 1620, height: 3136 },
    screenBounds: { x: 112, y: 111, width: 1396, height: 2916 },
    cornerRadius: 135
  },
  {
    id: "pixel_9_pro_xl",
    name: "Google Pixel 9 Pro XL",
    platform: "android",
    category: "phone",
    frameAsset: "/devices/pixel-9-pro-xl.png",
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
    frameAsset: "/devices/ipad-pro-13-m4.png",
    imageDimensions: { width: 2264, height: 2952 },
    screenBounds: { x: 100, y: 100, width: 2064, height: 2752 },
    cornerRadius: 40
  },
  {
    id: "ipad_pro_11_m4",
    name: 'iPad Pro 11" (M4)',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-pro-11-m4.png",
    imageDimensions: { width: 1868, height: 2620 },
    screenBounds: { x: 100, y: 116, width: 1668, height: 2388 },
    cornerRadius: 40
  },
  {
    id: "ipad_air_13",
    name: 'iPad Air 13"',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-air-13.png",
    imageDimensions: { width: 2248, height: 2932 },
    screenBounds: { x: 100, y: 100, width: 2048, height: 2732 },
    cornerRadius: 40
  },
  {
    id: "ipad_air_11",
    name: 'iPad Air 11"',
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-air-11.png",
    imageDimensions: { width: 1880, height: 2600 },
    screenBounds: { x: 120, y: 120, width: 1640, height: 2360 },
    cornerRadius: 40
  },
  {
    id: "ipad_mini_7",
    name: "iPad mini 7",
    platform: "ios",
    category: "tablet",
    frameAsset: "/devices/ipad-mini-7.png",
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
    frameAsset: "/devices/macbook-air-13.png",
    imageDimensions: { width: 3260, height: 2164 },
    screenBounds: { x: 350, y: 306, width: 2560, height: 1608 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_13_menu_bar",
    name: 'MacBook Air 13" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-13-menu-bar.png",
    imageDimensions: { width: 3260, height: 2164 },
    screenBounds: { x: 350, y: 312, width: 2560, height: 1602 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_15",
    name: 'MacBook Air 15"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-15.png",
    imageDimensions: { width: 3580, height: 2364 },
    screenBounds: { x: 350, y: 306, width: 2880, height: 1808 },
    cornerRadius: 20
  },
  {
    id: "macbook_air_15_menu_bar",
    name: 'MacBook Air 15" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-air-15-menu-bar.png",
    imageDimensions: { width: 3580, height: 2364 },
    screenBounds: { x: 350, y: 308, width: 2880, height: 1806 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_14",
    name: 'MacBook Pro 14"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-14.png",
    imageDimensions: { width: 3944, height: 2564 },
    screenBounds: { x: 461, y: 364, width: 3022, height: 1900 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_14_menu_bar",
    name: 'MacBook Pro 14" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-14-menu-bar.png",
    imageDimensions: { width: 3824, height: 2564 },
    screenBounds: { x: 401, y: 374, width: 3022, height: 1890 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_16",
    name: 'MacBook Pro 16"',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-16.png",
    imageDimensions: { width: 4340, height: 2860 },
    screenBounds: { x: 442, y: 377, width: 3456, height: 2170 },
    cornerRadius: 20
  },
  {
    id: "macbook_pro_16_menu_bar",
    name: 'MacBook Pro 16" (Menu Bar)',
    platform: "macos",
    category: "laptop",
    frameAsset: "/devices/macbook-pro-16-menu-bar.png",
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
    frameAsset: "/devices/imac-24.png",
    imageDimensions: { width: 4880, height: 5720 },
    screenBounds: { x: 200, y: 1600, width: 4480, height: 2520 },
    cornerRadius: 0
  },
  {
    id: "studio_display",
    name: "Studio Display",
    platform: "macos",
    category: "desktop",
    frameAsset: "/devices/studio-display.png",
    imageDimensions: { width: 5520, height: 4316 },
    screenBounds: { x: 200, y: 200, width: 5120, height: 2880 },
    cornerRadius: 0
  },
  {
    id: "pro_display_xdr",
    name: "Pro Display XDR",
    platform: "macos",
    category: "desktop",
    frameAsset: "/devices/pro-display-xdr.png",
    imageDimensions: { width: 6416, height: 4865 },
    screenBounds: { x: 200, y: 200, width: 6016, height: 3384 },
    cornerRadius: 0
  }
];
function getDeviceFrame(id) {
  return deviceFrames.find((d) => d.id === id);
}

// src/lib/shot-dsl/frames.ts
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

// src/lib/shot-dsl/compose.ts
function composeTemplate(plan) {
  const canvasWidth = plan.canvasWidth ?? 280;
  const canvasHeight = plan.canvasHeight ?? 600;
  const screens = plan.screens.map((screen) => {
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
      layers: [screenshot, frame, headline]
    });
  });
  return makeTemplate({ name: plan.name, screens, tags: ["generated"] });
}

// skill/appshot-screenshots/src/cli.ts
var BASE = (process.env.APPSHOTEDITOR_URL ?? "https://appshoteditor.com").replace(/\/$/, "");
var TOKEN = process.env.APPSHOTEDITOR_TOKEN;
function fail(message) {
  console.error(`appshot: ${message}`);
  process.exit(1);
}
function authHeaders() {
  if (!TOKEN) {
    fail("APPSHOTEDITOR_TOKEN is not set. Sign in at " + BASE + "/account and generate a token.");
  }
  return { Authorization: `Bearer ${TOKEN}` };
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
async function upload(files) {
  if (files.length === 0) fail("upload: provide one or more image files");
  const headers = authHeaders();
  const assets = [];
  for (const file of files) {
    const buf = readFileSync(file);
    const dims = imageSize(buf);
    const form = new FormData();
    form.append("file", new Blob([buf], { type: contentType(file) }), basename(file));
    if (dims) {
      form.append("width", String(dims.width));
      form.append("height", String(dims.height));
    }
    const res = await fetch(`${BASE}/api/screenshots`, { method: "POST", headers, body: form });
    if (res.status === 413) fail(`storage quota exceeded uploading ${file}`);
    if (!res.ok) fail(`upload failed for ${file}: ${res.status} ${await res.text()}`);
    const { asset } = await res.json();
    assets.push({ ...asset, filename: basename(file) });
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
    console.error("Usage: appshot <upload files\u2026 | compose plan.json | publish plan.json>");
    process.exit(1);
}
