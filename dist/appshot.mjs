#!/usr/bin/env node
// @appshoteditor/shot-dsl 0.4.0

// src/cli.ts
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, dirname, extname, join, resolve } from "node:path";

// node_modules/@appshoteditor/shot-dsl/src/types.ts
var CURRENT_SCHEMA_VERSION = 2;

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
var UPLOADED_SCREENSHOT_SRC = /^\/api\/screenshots\/[A-Za-z0-9_-]{1,128}\/raw$/;
function isUploadedScreenshotSrc(src) {
  return typeof src === "string" && UPLOADED_SCREENSHOT_SRC.test(src);
}
var DEVICE_FRAME_SRC = /^\/devices\/[a-z0-9][a-z0-9-]*\.(?:webp|png)$/;
function isDeviceFrameSrc(src) {
  return typeof src === "string" && DEVICE_FRAME_SRC.test(src);
}
var SCREENSHOT_ROTATIONS = [0, 90, 180, 270];
var SCREENSHOT_KEYS = /* @__PURE__ */ new Set(["src", "width", "height", "rotation"]);
function validateDeviceScreenshot(value, at = "screenshot") {
  if (!value || typeof value !== "object" || Array.isArray(value)) return [`${at} must be an object`];
  const errors = [];
  const shot = value;
  for (const key of Object.keys(shot)) {
    if (!SCREENSHOT_KEYS.has(key)) errors.push(`${at}.${key} is not allowed`);
  }
  if (!isUploadedScreenshotSrc(shot.src)) {
    errors.push(`${at}.src must be an uploaded screenshot URL (/api/screenshots/<id>/raw)`);
  }
  for (const dim of ["width", "height"]) {
    const n = shot[dim];
    if (typeof n !== "number" || !Number.isFinite(n) || n <= 0) {
      errors.push(`${at}.${dim} must be a positive number`);
    }
  }
  if (shot.rotation !== void 0 && !SCREENSHOT_ROTATIONS.includes(shot.rotation)) {
    errors.push(`${at}.rotation must be one of 0, 90, 180, 270`);
  }
  return errors;
}
var EDITOR_INTERNAL_PROPS = [
  "pendingScreenshot",
  "_lastFrameScaleX",
  "_lastFrameScaleY",
  "_userScale",
  "_userOffsetX",
  "_userOffsetY"
];
var FORBIDDEN_KEYS = ["__proto__", "constructor", "prototype"];
function findForbiddenKeys(value, at, depth = 0) {
  if (depth > 32 || !value || typeof value !== "object") return [];
  const errors = [];
  const entries = Array.isArray(value) ? value.map((v, k) => [`[${k}]`, v]) : Object.keys(value).map((k) => [`.${k}`, value[k]]);
  for (const [suffix2, v] of entries) {
    const key = suffix2.startsWith(".") ? suffix2.slice(1) : null;
    if (key !== null && FORBIDDEN_KEYS.includes(key)) {
      errors.push(`${at}${suffix2} is not allowed`);
      continue;
    }
    errors.push(...findForbiddenKeys(v, `${at}${suffix2}`, depth + 1));
  }
  return errors;
}
function isAllowedImageRef(value) {
  return isUploadedScreenshotSrc(value) || isDeviceFrameSrc(value);
}
function checkImageRefs(value, at, errors, depth = 0) {
  if (depth > 32) {
    errors.push(`${at} is nested too deeply`);
    return;
  }
  if (Array.isArray(value)) {
    value.forEach((v, k) => checkImageRefs(v, `${at}[${k}]`, errors, depth + 1));
    return;
  }
  if (!value || typeof value !== "object") return;
  for (const [key, v] of Object.entries(value)) {
    if ((key === "src" || key === "source") && !isAllowedImageRef(v)) {
      errors.push(
        `${at}.${key} must be an uploaded screenshot (/api/screenshots/<id>/raw) or a device frame asset (/devices/<name>.webp|png)`
      );
    } else if (v && typeof v === "object") {
      checkImageRefs(v, `${at}.${key}`, errors, depth + 1);
    }
  }
}
function validateLayerFabricData(layer, fd, at, frameIds) {
  const errors = [];
  const fdAt = `${at}.fabricData`;
  for (const prop of EDITOR_INTERNAL_PROPS) {
    if (prop in fd) errors.push(`${fdAt}.${prop} is editor-internal and not allowed`);
  }
  const isLegacyScreenshot = fd.layerRole === "screenshot";
  if (layer.type === "device") {
    if (fd.layerRole !== void 0 && fd.layerRole !== "frame") {
      errors.push(`${fdAt}.layerRole must be "frame" on a device layer`);
    }
    if (typeof fd.deviceId !== "string" || !getDeviceFrame(fd.deviceId)) {
      errors.push(`${fdAt}.deviceId must be a known device id`);
    }
    if (!isDeviceFrameSrc(fd.src)) {
      errors.push(`${fdAt}.src must be a device frame asset (/devices/<name>.webp|png)`);
    }
    if (typeof fd.deviceFrameId === "string" && fd.deviceFrameId) {
      if (frameIds.has(fd.deviceFrameId)) {
        errors.push(`${fdAt}.deviceFrameId "${fd.deviceFrameId}" is duplicated in this screen`);
      }
      frameIds.add(fd.deviceFrameId);
    }
  } else if (isLegacyScreenshot) {
    if (layer.type !== "image" || typeof fd.type !== "string" || fd.type.toLowerCase() !== "image") {
      errors.push(`${fdAt}.layerRole "screenshot" is only allowed on image layers`);
    }
    if (!isUploadedScreenshotSrc(fd.src)) {
      errors.push(`${fdAt}.src must be an uploaded screenshot URL (/api/screenshots/<id>/raw)`);
    }
    if (fd.deviceId !== void 0 && (typeof fd.deviceId !== "string" || !getDeviceFrame(fd.deviceId))) {
      errors.push(`${fdAt}.deviceId must be a known device id`);
    }
  } else {
    if (fd.layerRole !== void 0) errors.push(`${fdAt}.layerRole is only allowed on device / legacy screenshot layers`);
    for (const key of ["deviceFrameId", "deviceId", "deviceScale"]) {
      if (fd[key] !== void 0) errors.push(`${fdAt}.${key} is only allowed on device / legacy screenshot layers`);
    }
    if (fd.layerType === "deviceFrame") errors.push(`${fdAt}.layerType "deviceFrame" is only allowed on device layers`);
  }
  if (fd.screenshot !== void 0) {
    if (layer.type !== "device") errors.push(`${fdAt}.screenshot is only allowed on device layers`);
    errors.push(...validateDeviceScreenshot(fd.screenshot, `${fdAt}.screenshot`));
  }
  const { src: _src, screenshot: _screenshot, ...rest } = fd;
  void _screenshot;
  if (layer.type !== "device" && !isLegacyScreenshot && _src !== void 0 && !isAllowedImageRef(_src)) {
    errors.push(
      `${fdAt}.src must be an uploaded screenshot (/api/screenshots/<id>/raw) or a device frame asset (/devices/<name>.webp|png)`
    );
  }
  checkImageRefs(rest, fdAt, errors);
  return errors;
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
      const layerIds = /* @__PURE__ */ new Set();
      const frameIds = /* @__PURE__ */ new Set();
      s.layers.forEach((layer, j) => {
        const at = `screens[${i}].layers[${j}]`;
        if (!isValidLayerJSON(layer)) errors.push(`${at} is invalid`);
        errors.push(...findForbiddenKeys(layer, at));
        if (layerIds.has(layer.id)) errors.push(`${at}.id "${layer.id}" is duplicated in this screen`);
        layerIds.add(layer.id);
        const fd = layer.fabricData;
        if (!fd || typeof fd !== "object") return;
        errors.push(...validateLayerFabricData(layer, fd, at, frameIds));
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
function makeShapeLayer(opts) {
  const id = opts.id ?? generateLayerId();
  const common = {
    left: opts.left,
    top: opts.top,
    fill: opts.fill ?? "#0ea5e9",
    originX: "center",
    originY: "center",
    layerId: id,
    layerType: "shape"
  };
  const fabricData = opts.shape === "circle" ? { type: "circle", radius: opts.radius ?? 50, ...common, shapeType: "circle" } : {
    type: "Rect",
    width: opts.width ?? 100,
    height: opts.height ?? 100,
    rx: opts.rx ?? 0,
    ry: opts.ry ?? 0,
    ...common,
    shapeType: "rectangle"
  };
  return {
    id,
    name: opts.name ?? "Shape",
    type: "shape",
    visible: opts.visible ?? true,
    locked: opts.locked ?? false,
    templateRole: opts.templateRole,
    templateKey: opts.templateKey,
    fabricData
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
function makeDeviceFrameLayer(opts) {
  const device = getDeviceFrame(opts.deviceId);
  if (!device) throw new Error(`Unknown device: ${opts.deviceId}`);
  const canvasWidth = opts.canvasWidth ?? DEFAULT_CANVAS_WIDTH2;
  const canvasHeight = opts.canvasHeight ?? DEFAULT_CANVAS_HEIGHT2;
  const scale = opts.scale ?? calculateDeviceScale(device, canvasWidth, canvasHeight);
  const frameId = `device-frame-${generateLayerId()}`;
  const fabricData = {
    type: "image",
    src: device.frameAsset,
    crossOrigin: "anonymous",
    left: opts.centerX ?? canvasWidth / 2,
    top: opts.centerY ?? canvasHeight / 2,
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
  };
  if (opts.angle) fabricData.angle = opts.angle;
  if (opts.screenshotUrl) {
    const { screenshotWidth: width, screenshotHeight: height } = opts;
    if (!(typeof width === "number" && width > 0 && typeof height === "number" && height > 0)) {
      throw new Error("makeDeviceFrameLayer: screenshotWidth/screenshotHeight (> 0) are required with screenshotUrl");
    }
    const screenshot = { src: opts.screenshotUrl, width, height };
    if (opts.screenshotRotation) screenshot.rotation = opts.screenshotRotation;
    fabricData.screenshot = screenshot;
  }
  return {
    id: frameId,
    name: opts.name ?? device.name,
    type: "device",
    visible: true,
    locked: false,
    fabricData
  };
}

// node_modules/@appshoteditor/shot-dsl/src/layout-system.ts
var NO_TANGENT = {
  /** A subject that stays on-canvas must clear the edge by at least this × H. */
  clearGap: 0.04,
  /** A subject that bleeds must lose at least this × its own (rotated) height. */
  minBleed: 0.12,
  /** `bleed: "deep"` target, × the subject's height. */
  deepBleed: 0.25,
  /** The focus band must end at least this × H inside the canvas edge. */
  focusSafe: 0.02,
  /** Upper bound on the subject's (unrotated) width — targets are clamped to it too, × W. */
  maxWidth: 0.9,
  /**
   * Horizontal no-tangent rule: the subject's VISIBLE extent keeps at least this × W from each side
   * edge (a side bleed is only allowed as a deliberate panorama straddle across a seam).
   */
  sideMargin: 0.05,
  /** The focus band's (rotated) corners stay at least this × W inside the side edges / seams. */
  focusSideSafe: 0.02,
  /** A clear-with-margin option that shrinks the subject below this × its natural scale is rejected. */
  minClearScale: 0.6,
  /** Below this × the layout's target scale the copy leaves no usable room (composeSet throws). */
  minScale: 0.5
};
var EPS = 1e-6;
function rotatedBox(width, height, angle = 0) {
  const r = angle * Math.PI / 180;
  const c = Math.abs(Math.cos(r));
  const s = Math.abs(Math.sin(r));
  return { width: width * c + height * s, height: width * s + height * c };
}
function subjectPointToCanvas(subject, p, pose) {
  const r = (pose.angle ?? 0) * Math.PI / 180;
  const lx = (p.x - subject.width / 2) * pose.scale;
  const ly = (p.y - subject.height / 2) * pose.scale;
  return {
    x: pose.cx + lx * Math.cos(r) - ly * Math.sin(r),
    y: pose.cy + lx * Math.sin(r) + ly * Math.cos(r)
  };
}
function focusCorners(subject, focus) {
  const { x, y, width, height } = subject.screen;
  const top = y + focus.top * height;
  const bottom = y + focus.bottom * height;
  return [
    { x, y: top },
    { x: x + width, y: top },
    { x: x + width, y: bottom },
    { x, y: bottom }
  ];
}
function focusReach(subject, focus, angle, farEdge) {
  const box = rotatedBox(subject.width, subject.height, angle);
  const ys = focusCorners(subject, focus).map((p) => subjectPointToCanvas(subject, p, { cx: 0, cy: 0, scale: 1, angle }).y);
  return farEdge === "bottom" ? Math.max(...ys) + box.height / 2 : box.height / 2 - Math.min(...ys);
}
function subjectCorners(subject, pose) {
  return [
    { x: 0, y: 0 },
    { x: subject.width, y: 0 },
    { x: subject.width, y: subject.height },
    { x: 0, y: subject.height }
  ].map((p) => subjectPointToCanvas(subject, p, pose));
}
function clipPolygonToBand(points, y0, y1) {
  const clip = (pts, inside, cut) => {
    const out = [];
    pts.forEach((cur, i) => {
      const prev = pts[(i + pts.length - 1) % pts.length];
      if (inside(cur)) {
        if (!inside(prev)) out.push(cut(prev, cur));
        out.push(cur);
      } else if (inside(prev)) out.push(cut(prev, cur));
    });
    return out;
  };
  const atY = (y) => (a, b) => ({ x: a.x + (b.x - a.x) * (y - a.y) / (b.y - a.y), y });
  const top = clip(points, (p) => p.y >= y0, atY(y0));
  return top.length ? clip(top, (p) => p.y <= y1, atY(y1)) : [];
}
function visibleXExtent(subject, pose, canvasHeight) {
  const poly = clipPolygonToBand(subjectCorners(subject, pose), 0, canvasHeight);
  if (poly.length === 0) return null;
  const xs = poly.map((p) => p.x);
  return { min: Math.min(...xs), max: Math.max(...xs) };
}
function focusXExtent(subject, focus, pose) {
  const xs = focusCorners(subject, focus).map((p) => subjectPointToCanvas(subject, p, pose).x);
  return { min: Math.min(...xs), max: Math.max(...xs) };
}
function inTangentZone(overshoot, subjectHeight, canvasHeight) {
  return overshoot > -NO_TANGENT.clearGap * canvasHeight + EPS && overshoot < NO_TANGENT.minBleed * subjectHeight - EPS;
}
function solveVertical(inp) {
  const W = inp.canvasWidth;
  const H = inp.canvasHeight;
  const eh = inp.boxHeight;
  const near0 = Math.max(inp.near, inp.minNear ?? 0);
  const cap = inp.scaleCap ?? Infinity;
  const sCap = Math.min(NO_TANGENT.maxWidth * W / inp.baseWidth, cap);
  const target = Math.min(inp.targetWidth, NO_TANGENT.maxWidth);
  const s0 = Math.max(0, Math.min(target * W / inp.baseWidth, (H - near0) / (1 - inp.maxBleed) / eh, cap));
  const focusLimit = H * (1 - NO_TANGENT.focusSafe);
  const overshoot = (s, a) => a + s * eh - H;
  const focusOk = (s, a) => inp.focusReach == null || a + s * inp.focusReach <= focusLimit + EPS;
  const make = (s, a, reason) => {
    const o = overshoot(s, a);
    return { scale: s, near: a, overshoot: o, mode: o > 0 ? "bleed" : "clear", bleedFraction: o / (s * eh), reason };
  };
  const clearOption = () => {
    const s = Math.min(s0, (H * (1 - NO_TANGENT.clearGap) - near0) / eh);
    if (!(s > 0) || s < NO_TANGENT.minClearScale * s0 - EPS) return null;
    return make(s, near0, s < s0 - EPS ? "shrunk to clear the edge with a margin" : "clears the edge");
  };
  const bleedOption = (t) => {
    let s = s0;
    let a = near0;
    if (overshoot(s, a) < t * s * eh - EPS) {
      const need = (H - a) / ((1 - t) * eh);
      s = Math.max(s0, Math.min(need, Math.max(sCap, s0)));
      if (overshoot(s, a) < t * s * eh - EPS) a = H - s * eh * (1 - t);
    }
    if (focusOk(s, a)) return make(s, a, `bleeds ${Math.round(t * 100)}%+`);
    if (inp.focusReach == null) return null;
    const fr = inp.focusReach;
    const sF = Math.min(s, Math.max(sCap, s0), (focusLimit - near0) / fr);
    const denom = eh * (1 - NO_TANGENT.minBleed) - fr;
    if (!(sF > 0) || denom <= 0 || sF < (H - focusLimit) / denom - EPS) return null;
    const aF = Math.max(near0, Math.min(focusLimit - sF * fr, H - sF * eh * (1 - t)));
    if (overshoot(sF, aF) < NO_TANGENT.minBleed * sF * eh - EPS || !focusOk(sF, aF)) return null;
    return make(sF, aF, "bleed reduced to keep the focus band visible");
  };
  const forcedClear = () => make(Math.max(0, Math.min(s0, (H * (1 - NO_TANGENT.clearGap) - near0) / eh)), near0, "forced clear");
  if (inp.bleed === "none") return clearOption() ?? forcedClear();
  const naturalOver = overshoot(s0, near0);
  const naturalClear = naturalOver <= -NO_TANGENT.clearGap * H + EPS;
  const naturalBleed = naturalOver >= NO_TANGENT.minBleed * s0 * eh - EPS;
  if (inp.bleed === "deep") {
    const t = Math.max(NO_TANGENT.deepBleed, naturalBleed ? naturalOver / (s0 * eh) : 0);
    return bleedOption(t) ?? clearOption() ?? forcedClear();
  }
  if (naturalClear && !inp.preferBleed) return make(s0, near0, "natural placement clears the edge");
  if (naturalBleed && focusOk(s0, near0)) return make(s0, near0, "natural placement bleeds decisively");
  const bleed = bleedOption(NO_TANGENT.minBleed);
  if (bleed) return inp.preferBleed ? { ...bleed, reason: `${bleed.reason} (tilt pairs with a bleed)` } : bleed;
  if (naturalClear) return make(s0, near0, "natural placement clears the edge");
  return clearOption() ?? forcedClear();
}
function rectsOverlap(a, b) {
  return a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
}

// node_modules/@appshoteditor/shot-dsl/src/color.ts
var HEX = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function isHexColor(value) {
  return typeof value === "string" && HEX.test(value);
}
function parseHex(hex) {
  if (!isHexColor(hex)) return null;
  let h = hex.slice(1);
  if (h.length === 3) h = h.replace(/./g, (c) => c + c);
  return { r: parseInt(h.slice(0, 2), 16), g: parseInt(h.slice(2, 4), 16), b: parseInt(h.slice(4, 6), 16) };
}
function toHex({ r, g, b }) {
  const c = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, "0");
  return `#${c(r)}${c(g)}${c(b)}`.toUpperCase();
}
function mixHex(a, b, t) {
  const x = parseHex(a);
  const y = parseHex(b);
  if (!x || !y) return a;
  return toHex({ r: x.r + (y.r - x.r) * t, g: x.g + (y.g - x.g) * t, b: x.b + (y.b - x.b) * t });
}
var lighten = (hex, t) => mixHex(hex, "#ffffff", t);
var darken = (hex, t) => mixHex(hex, "#000000", t);
function luminance(hex) {
  const c = parseHex(hex);
  if (!c) return 0;
  const lin = (v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}
function rgba(hex, alpha) {
  const c = parseHex(hex) ?? { r: 255, g: 255, b: 255 };
  return `rgba(${c.r},${c.g},${c.b},${alpha})`;
}
function contrastRatio(a, b) {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
var DARK_TEXT = "#111827";
var LIGHT_TEXT = "#FFFFFF";
function readableTextOn(backgrounds) {
  const worst = (text) => Math.min(...backgrounds.map((bg) => contrastRatio(text, bg)));
  return worst(DARK_TEXT) > worst(LIGHT_TEXT) ? DARK_TEXT : LIGHT_TEXT;
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
var COMPOSE_LAYOUTS = ["text-top", "text-bottom", "device-bleed"];
var COMPOSE_PRESENTATIONS = ["device", "frameless", "zoom"];
var COMPOSE_BLEEDS = ["auto", "none", "deep"];
var COMPOSE_FONTS = [
  "Inter",
  "Arial",
  "Helvetica",
  "Georgia",
  "Times New Roman",
  "Courier New",
  "Verdana",
  "Trebuchet MS",
  "Impact",
  "Comic Sans MS"
];
var TYPE_UNIT_HEIGHT_CAP = 0.55;
var HEADLINE_SIZE = 0.085;
var HEADLINE_LINE_HEIGHT = 1.1;
var SUBHEADLINE_RATIO = 0.55;
var SUBHEADLINE_LINE_HEIGHT = 1.25;
var SUBHEADLINE_OPACITY = 0.85;
var TEXT_WIDTH = 0.84;
var FONT_CHAR_WIDTH = {
  Inter: 0.66,
  Arial: 0.64,
  Helvetica: 0.64,
  Georgia: 0.72,
  "Times New Roman": 0.63,
  "Courier New": 0.66,
  Verdana: 0.76,
  "Trebuchet MS": 0.68,
  Impact: 0.64,
  "Comic Sans MS": 0.76
};
var MONOSPACE_FONTS = /* @__PURE__ */ new Set(["Courier New"]);
var AVG_CHAR_WIDTH = FONT_CHAR_WIDTH.Inter;
var metricsOf = (m) => typeof m === "number" ? { charWidth: m, mono: false } : { charWidth: FONT_CHAR_WIDTH[m] ?? AVG_CHAR_WIDTH, mono: MONOSPACE_FONTS.has(m) };
var EDGE_MARGIN = 0.055;
var TEXT_GAP = 0.3;
var DEVICE_GAP = 0.04;
var COPY_RULES = { headlineMaxWords: 5, headlineMaxLines: 2, subheadlineMaxLines: 1, maxTiltedScreens: 2 };
var BADGE_FONT = 0.36;
var BADGE_PAD_X = 1.1;
var BADGE_HEIGHT = 2.1;
var BADGE_GAP = 0.45;
var BADGE_MAX_CHARS = 28;
var FRAMELESS_WIDTH = 0.9;
var FRAMELESS_RADIUS = 0.1;
var ZOOM_WIDTH = 0.88;
var ZOOM_RADIUS = 0.05;
var ZOOM_MAX_MAG = 2;
var ZOOM_MIN_ASPECT = 0.5;
var SHADOW = { color: "rgba(0,0,0,0.28)", blur: 0.07, offsetY: 0.025 };
var STRADDLE_OVERLAP = 0.18;
var STRADDLE_MIN = 0.06;
var MAX_STRADDLES = 1;
var ORB_RADIUS = 0.34;
var ORB_Y = 0.7;
var ORB_MIN_RADIUS = 0.08;
var ORB_TEXT_GAP = 0.02;
var LAYOUTS = {
  "text-top": { deviceWidth: 0.86, maxBleed: 0.2, minDeviceTop: 0 },
  "text-bottom": { deviceWidth: 0.9, maxBleed: 0.2, minDeviceTop: 0 },
  // Capped at NO_TANGENT.maxWidth (90% W — a 5% side margin); the hero differs by sitting lower.
  "device-bleed": { deviceWidth: 0.9, maxBleed: 0.4, minDeviceTop: 0.28 }
};
function charUnits(ch) {
  if (ch === " ") return 0.5;
  if ("iljI.,:;!|'\u2019".includes(ch)) return 0.5;
  if ("ftr()[]-\u2013".includes(ch)) return 0.7;
  if ("mwMW".includes(ch)) return 1.55;
  if (ch >= "A" && ch <= "Z") return 1.3;
  return 1;
}
function estimateTextWidth(text, fontSize, metrics = "Inter") {
  const { charWidth, mono } = metricsOf(metrics);
  return [...text].reduce((sum, ch) => sum + (mono ? 1 : charUnits(ch)), 0) * fontSize * charWidth;
}
function estimateLines(text, fontSize, width, metrics = "Inter") {
  const { charWidth, mono } = metricsOf(metrics);
  const unit = fontSize * charWidth;
  const maxUnits = Math.max(1, width / unit);
  const cu = (ch) => mono ? 1 : charUnits(ch);
  const units = (w) => [...w].reduce((sum, ch) => sum + cu(ch), 0);
  let lines = 0;
  for (const paragraph of text.split("\n")) {
    let current = 0;
    lines++;
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const len = units(word);
      if (current === 0) {
        current = len;
      } else if (current + cu(" ") + len <= maxUnits) {
        current += cu(" ") + len;
      } else {
        lines++;
        current = len;
      }
      while (current > maxUnits) {
        lines++;
        current -= maxUnits;
      }
    }
  }
  return Math.max(1, lines);
}
function measureTextBlock(screen, t) {
  const headlineLines = estimateLines(screen.headline, t.headlineSize, t.textWidth, t.font);
  const headlineHeight = headlineLines * t.headlineSize * HEADLINE_LINE_HEIGHT;
  const hasSub = !!screen.subheadline?.trim();
  const subLines = hasSub ? estimateLines(screen.subheadline, t.subSize, t.textWidth, t.font) : 0;
  const subHeight = subLines * t.subSize * SUBHEADLINE_LINE_HEIGHT;
  const gap = hasSub ? t.headlineSize * TEXT_GAP : 0;
  return { headlineLines, headlineHeight, subLines, subHeight, gap, height: t.badgeRow + headlineHeight + gap + subHeight };
}
var clamp01 = (n) => Math.min(1, Math.max(0, n));
function normalizeFocus(focus) {
  if (!focus || typeof focus.top !== "number" || typeof focus.bottom !== "number") return void 0;
  const top = clamp01(Math.min(focus.top, focus.bottom));
  const bottom = clamp01(Math.max(focus.top, focus.bottom));
  return bottom > top ? { top, bottom } : void 0;
}
function backgroundStops(bg) {
  const stops = bg.gradient?.colorStops;
  if (bg.type === "gradient" && stops && stops.length > 0) return stops;
  const v1 = bg.gradient?.colors?.filter(isHexColor) ?? [];
  if (bg.type === "gradient" && v1.length > 0) return evenStops(v1.length === 1 ? [v1[0], v1[0]] : v1);
  const c = isHexColor(bg.color) ? bg.color : "#1F2937";
  return [
    { offset: 0, color: lighten(c, 0.14) },
    { offset: 1, color: darken(c, 0.14) }
  ];
}
function evenStops(colors) {
  return colors.map((color, i) => ({ offset: colors.length > 1 ? i / (colors.length - 1) : 0, color }));
}
var linear = (colorStops) => ({ type: "gradient", gradient: { type: "linear", colorStops } });
function paletteBackground(palette, index) {
  const colors = (palette?.colors ?? []).filter(isHexColor);
  if (!palette || colors.length === 0) return null;
  if (palette.mode === "sequence") {
    const c = colors[index % colors.length];
    return linear([
      { offset: 0, color: lighten(c, 0.16) },
      { offset: 1, color: c }
    ]);
  }
  return linear(evenStops(colors.length === 1 ? [colors[0], darken(colors[0], 0.22)] : colors));
}
function colorAt(stops, t) {
  const sorted = stops.filter((c) => isHexColor(c.color)).sort((a, b) => a.offset - b.offset);
  if (sorted.length === 0) return "#1F2937";
  if (t <= sorted[0].offset) return sorted[0].color;
  for (let i = 1; i < sorted.length; i++) {
    const a = sorted[i - 1];
    const b = sorted[i];
    if (t <= b.offset) return mixHex(a.color, b.color, b.offset > a.offset ? (t - a.offset) / (b.offset - a.offset) : 1);
  }
  return sorted[sorted.length - 1].color;
}
function rampT(c, x, y) {
  const dx = c.x2 - c.x1;
  const dy = c.y2 - c.y1;
  const len2 = dx * dx + dy * dy || 1;
  return clamp01(((x - c.x1) * dx + (y - c.y1) * dy) / len2);
}
function angleCoords(angle, w, h) {
  const rad = ((angle || 180) - 90) * Math.PI / 180;
  return {
    x1: (0.5 + Math.cos(rad) * 0.5) * w,
    y1: (0.5 + Math.sin(rad) * 0.5) * h,
    x2: (0.5 - Math.cos(rad) * 0.5) * w,
    y2: (0.5 - Math.sin(rad) * 0.5) * h
  };
}
function sampleBackground(bg, W, H, x, y) {
  if (bg.type !== "gradient" || !bg.gradient) return isHexColor(bg.color) ? bg.color : "#1F2937";
  return colorAt(backgroundStops(bg), rampT(bg.gradient.coords ?? angleCoords(bg.gradient.angle, W, H), x, y));
}
function spanFillFor(bg, first, N, W, H) {
  if (bg.type !== "gradient" || !bg.gradient) return { kind: "solid", color: isHexColor(bg.color) ? bg.color : "#1F2937" };
  const at = `panorama span starting at screen ${first + 1}`;
  if (bg.gradient.type === "radial") {
    throw new Error(`${at}: a radial gradient background can't run across screens \u2014 use a linear gradient or a solid colour`);
  }
  if (bg.gradient.coords) {
    throw new Error(`${at}: explicit gradient \`coords\` are per-screen and can't span screens \u2014 use \`angle\` (or omit it) instead`);
  }
  const stops = backgroundStops(bg);
  const coords = bg.gradient.angle != null ? angleCoords(bg.gradient.angle, N * W, H) : { x1: 0, y1: 0, x2: N * W, y2: H };
  return { kind: "linear", stops, coords };
}
function samplePanorama(fill, k, W, x, y) {
  return fill.kind === "solid" ? fill.color : colorAt(fill.stops, rampT(fill.coords, k * W + x, y));
}
function subjectFor(r) {
  if (r.presentation === "device") {
    const device = getDeviceFrame(r.plan.deviceId);
    if (!device) throw new Error(`Unknown device: ${r.plan.deviceId}`);
    const { width: width2, height: height2 } = device.imageDimensions;
    return { width: width2, height: height2, screen: { ...device.screenBounds } };
  }
  const { width, height } = r.plan.screenshot;
  return { width, height, screen: { x: 0, y: 0, width, height } };
}
function nearStart(t) {
  return t.margin + t.textArea + t.deviceGap;
}
function fitCrop(shot, req, A, explicit) {
  const minW = explicit ? req.w : shot.width / ZOOM_MAX_MAG;
  let w = Math.min(shot.width, Math.max(minW, req.h / A));
  let h = w * A;
  if (h > shot.height) {
    h = shot.height;
    w = h / A;
  }
  const focusCropped = h < req.h - 0.5 || explicit && w < req.w - 0.5;
  const cx = req.x + req.w / 2;
  const cy = req.y + req.h / 2;
  const cropX = Math.min(Math.max(0, cx - w / 2), shot.width - w);
  const cropY = Math.min(Math.max(0, cy - h / 2), shot.height - h);
  return { cropX, cropY, cropW: w, cropH: h, focusCropped };
}
var HORIZONTAL_EPS = 1e-9;
var TILT_MIN_SCALE = 0.8;
function horizontalOk(subject, pose, W, H, focuses, straddleRight = false) {
  const eps = HORIZONTAL_EPS * W;
  const ext = visibleXExtent(subject, pose, H);
  if (ext) {
    const m = NO_TANGENT.sideMargin * W;
    if (ext.min < m - eps) return false;
    if (!straddleRight && ext.max > W - m + eps) return false;
  }
  const fs = NO_TANGENT.focusSideSafe * W;
  return focuses.every((f) => {
    const fx = focusXExtent(subject, f, pose);
    return fx.min >= fs - eps && fx.max <= W - fs + eps;
  });
}
function straddleShift(subject, pose, W, H, focuses) {
  const ext = visibleXExtent(subject, pose, H);
  if (!ext) return null;
  const visW = ext.max - ext.min;
  let dx = W + STRADDLE_OVERLAP * visW - ext.max;
  for (const f of focuses) dx = Math.min(dx, W * (1 - NO_TANGENT.focusSideSafe) - focusXExtent(subject, f, pose).max);
  const overlap = ext.max + dx - W;
  return dx > 0 && overlap >= STRADDLE_MIN * visW ? dx : null;
}
var screensOf = (members) => members.map((m) => m.index + 1).join(", ");
var copyTooLong = (members, W, H) => new Error(
  `copy too long for this canvas (${W}\xD7${H}, screen ${screensOf(members)}): the text leaves the device less than ${Math.round(NO_TANGENT.minScale * 100)}% of the room it gets with no copy \u2014 cut the subheadline or headline`
);
var canvasMismatch = (members, W, H, what, pct) => new Error(
  `${what} doesn't fit a ${W}\xD7${H} canvas (screen ${screensOf(members)}): even with no copy it renders at only ${Math.round(pct * 100)}% of its target width \u2014 use the device's own canvas (omit canvasWidth/canvasHeight) or another device`
);
var MIN_EMPTY_COPY_FIT = 0.3;
function placeGroup(members, bleed, warnings, straddleRight = false) {
  const out = /* @__PURE__ */ new Map();
  const first = members[0];
  const { W, H, typo, layout, presentation, tilt } = first;
  const spec = LAYOUTS[layout] ?? LAYOUTS["text-top"];
  const farEdge = layout === "text-bottom" ? "top" : "bottom";
  const near = nearStart(typo);
  const reduced = (to) => {
    if (to === tilt) return;
    warnings.push({
      screen: first.index,
      code: "tilt-reduced",
      message: `screen ${members.map((m) => m.index + 1).join(", ")}: tilt reduced from ${tilt}\xB0 to ${Math.round(to * 10) / 10}\xB0 so the device and its focus band keep their side margins`
    });
  };
  if (presentation === "zoom") {
    const avail = H * (1 - NO_TANGENT.clearGap) - near;
    const availEmpty = H * (1 - NO_TANGENT.clearGap) - (typo.margin + typo.deviceGap);
    if (!(avail > 0) || avail < NO_TANGENT.minScale * availEmpty) throw copyTooLong(members, W, H);
    let baseW = ZOOM_WIDTH * W;
    const baseH = avail;
    if (baseH < baseW * ZOOM_MIN_ASPECT) {
      baseW = baseH / ZOOM_MIN_ASPECT;
    }
    const aspect = baseH / baseW;
    const maxBoxWidth = (1 - 2 * NO_TANGENT.sideMargin) * W;
    const fitAt = (angle) => {
      const rad = angle * Math.PI / 180;
      const sin = Math.abs(Math.sin(rad));
      const cos = Math.abs(Math.cos(rad));
      const k = Math.min(1, maxBoxWidth / (baseW * (cos + aspect * sin)), avail / (baseW * (sin + aspect * cos)));
      return { k, boxW: k * baseW, boxH: k * baseW * aspect };
    };
    let angleUsed = 0;
    let fit = fitAt(0);
    for (const angle of tilt === 0 ? [0] : [tilt, tilt * 0.75, tilt * 0.5, tilt * 0.25, 0]) {
      const f = fitAt(angle);
      if (angle === 0 || f.k >= TILT_MIN_SCALE - 1e-9) {
        angleUsed = angle;
        fit = f;
        break;
      }
    }
    reduced(angleUsed);
    const tiltUsed = angleUsed;
    const { boxW, boxH } = fit;
    const box = rotatedBox(boxW, boxH, tiltUsed);
    for (const r of members) {
      const shot = r.plan.screenshot;
      const focus = normalizeFocus(r.plan.focus);
      const crop = r.plan.crop;
      const req = crop ? { x: clamp01(crop.x) * shot.width, y: clamp01(crop.y) * shot.height, w: Math.max(1, clamp01(crop.w) * shot.width), h: Math.max(1, clamp01(crop.h) * shot.height) } : focus ? { x: 0, y: focus.top * shot.height, w: shot.width, h: (focus.bottom - focus.top) * shot.height } : { x: 0, y: 0, w: shot.width, h: Math.min(shot.height, shot.width * (boxH / boxW)) };
      const zoom = fitCrop(shot, req, boxH / boxW, !!crop);
      const scale = boxW / zoom.cropW;
      const nearEdge = near;
      const cy = farEdge === "bottom" ? nearEdge + box.height / 2 : H - nearEdge - box.height / 2;
      const overshoot = nearEdge + box.height - H;
      out.set(r.index, {
        cx: W / 2,
        cy,
        scale,
        angle: tiltUsed,
        boxWidth: box.width,
        boxHeight: box.height,
        vertical: { scale, near: nearEdge, overshoot, mode: "clear", bleedFraction: overshoot / box.height, reason: "zoom card clears the edge" },
        subject: { width: zoom.cropW, height: zoom.cropH, screen: { x: 0, y: 0, width: zoom.cropW, height: zoom.cropH } },
        zoom
      });
    }
    return out;
  }
  const subject = subjectFor(first);
  const targetWidth = Math.min(spec.deviceWidth * (presentation === "frameless" ? FRAMELESS_WIDTH : 1), NO_TANGENT.maxWidth);
  const targetScale = targetWidth * W / subject.width;
  const focuses = members.map((r) => normalizeFocus(r.plan.focus)).filter((f) => !!f);
  const solve = (angle, scaleCap, nearOverride) => {
    const box = rotatedBox(subject.width, subject.height, angle);
    const reaches = focuses.map((f) => focusReach(subject, f, angle, farEdge));
    const vertical = solveVertical({
      canvasWidth: W,
      canvasHeight: H,
      near: nearOverride ?? near,
      minNear: spec.minDeviceTop * H,
      baseWidth: subject.width,
      boxHeight: box.height,
      targetWidth,
      maxBleed: spec.maxBleed,
      focusReach: reaches.length ? Math.max(...reaches) : null,
      bleed,
      preferBleed: angle !== 0,
      scaleCap
    });
    const s2 = vertical.scale;
    const cy = farEdge === "bottom" ? vertical.near + s2 * box.height / 2 : H - vertical.near - s2 * box.height / 2;
    return { vertical, box, cy, angle };
  };
  const straight = solve(0);
  const empty = solve(0, void 0, typo.margin + typo.deviceGap).vertical.scale;
  if (!(empty >= MIN_EMPTY_COPY_FIT * targetScale - 1e-9)) {
    throw canvasMismatch(members, W, H, presentation === "device" ? `device ${first.plan.deviceId}` : "this screenshot", empty / targetScale);
  }
  const minScale = NO_TANGENT.minScale * empty;
  if (!(straight.vertical.scale >= minScale - 1e-9)) throw copyTooLong(members, W, H);
  const tiltFloor = Math.max(minScale, TILT_MIN_SCALE * straight.vertical.scale);
  const search = (asStraddle) => {
    for (const angle of tilt === 0 ? [0] : [tilt, tilt * 0.75, tilt * 0.5, tilt * 0.25, 0]) {
      const floor = angle === 0 ? minScale : tiltFloor;
      let cap;
      for (let i = 0; i < 400; i++) {
        const sol = solve(angle, cap);
        const pose = { cx: W / 2, cy: sol.cy, scale: sol.vertical.scale, angle };
        if (sol.vertical.scale >= floor - 1e-9) {
          if (!asStraddle && horizontalOk(subject, pose, W, H, focuses)) return { sol, dx: void 0 };
          if (asStraddle) {
            const dx = straddleShift(subject, pose, W, H, focuses);
            if (dx != null && horizontalOk(subject, { ...pose, cx: pose.cx + dx }, W, H, focuses, true)) return { sol, dx };
          }
        }
        const next = sol.vertical.scale * 0.985;
        if (next < floor) break;
        cap = next;
      }
    }
    return null;
  };
  const found = (straddleRight ? search(true) : null) ?? search(false) ?? { sol: straight, dx: void 0 };
  const chosen = found.sol;
  reduced(chosen.angle);
  const s = chosen.vertical.scale;
  for (const r of members) {
    out.set(r.index, {
      cx: W / 2,
      cy: chosen.cy,
      scale: s,
      angle: chosen.angle,
      boxWidth: s * chosen.box.width,
      boxHeight: s * chosen.box.height,
      vertical: chosen.vertical,
      subject,
      straddleDx: found.dx
    });
  }
  return out;
}
function shadowFor(W, scale) {
  return { color: SHADOW.color, blur: SHADOW.blur * W / scale, offsetX: 0, offsetY: SHADOW.offsetY * W / scale };
}
function makeScreenshotImageLayer(r, p) {
  const id = generateLayerId();
  const shot = r.plan.screenshot;
  const zoom = p.zoom;
  const width = zoom ? zoom.cropW : shot.width;
  const height = zoom ? zoom.cropH : shot.height;
  const radius = zoom ? ZOOM_RADIUS * r.W : FRAMELESS_RADIUS * width * p.scale;
  const fabricData = {
    type: "image",
    src: shot.url,
    crossOrigin: "anonymous",
    left: p.cx,
    top: p.cy,
    width,
    height,
    scaleX: p.scale,
    scaleY: p.scale,
    originX: "center",
    originY: "center",
    // Rounded corners in the image's local (unscaled) space — same shape the editor's corner
    // radius control writes (`imageCornerRadius` is in canvas units).
    clipPath: {
      type: "Rect",
      left: 0,
      top: 0,
      width,
      height,
      rx: radius / p.scale,
      ry: radius / p.scale,
      originX: "center",
      originY: "center"
    },
    imageCornerRadius: radius,
    shadow: shadowFor(r.W, p.scale),
    layerId: id,
    layerType: "image"
  };
  if (zoom) {
    fabricData.cropX = zoom.cropX;
    fabricData.cropY = zoom.cropY;
  }
  if (p.angle) fabricData.angle = p.angle;
  return {
    id,
    name: zoom ? "Screenshot (zoom)" : "Screenshot",
    type: "image",
    visible: true,
    locked: false,
    fabricData
  };
}
function makeSubjectLayer(r, p, cx = p.cx, name) {
  if (r.presentation === "device") {
    return makeDeviceFrameLayer({
      deviceId: r.plan.deviceId,
      screenshotUrl: r.plan.screenshot.url,
      screenshotWidth: r.plan.screenshot.width,
      screenshotHeight: r.plan.screenshot.height,
      canvasWidth: r.W,
      canvasHeight: r.H,
      centerX: cx,
      centerY: p.cy,
      scale: p.scale,
      angle: p.angle,
      name
    });
  }
  const layer = makeScreenshotImageLayer(r, p);
  layer.fabricData.left = cx;
  if (name) layer.name = name;
  return layer;
}
function focusPolygon(r, p, cx) {
  const focus = normalizeFocus(r.plan.focus);
  if (!focus || p.zoom) return null;
  return focusCorners(p.subject, focus).map((pt) => subjectPointToCanvas(p.subject, pt, { cx, cy: p.cy, scale: p.scale, angle: p.angle }));
}
function validateSpans(plan, dims) {
  const spans = plan.style?.panorama?.spans ?? [];
  const seen = /* @__PURE__ */ new Set();
  for (const span of spans) {
    if (!Array.isArray(span) || span.length < 2) throw new Error("panorama span must list at least 2 screens");
    span.forEach((idx, k) => {
      if (!Number.isInteger(idx) || idx < 0 || idx >= plan.screens.length) throw new Error(`panorama span index ${idx} is out of range`);
      if (k > 0 && idx !== span[k - 1] + 1) throw new Error("panorama span screens must be adjacent and ascending");
      if (seen.has(idx)) throw new Error(`screen ${idx} is in more than one panorama span`);
      seen.add(idx);
      if (dims[idx].W !== dims[span[0]].W || dims[idx].H !== dims[span[0]].H) {
        throw new Error("panorama span screens must share one canvas size");
      }
    });
  }
  const straddle = plan.style?.panorama?.straddle;
  if (Array.isArray(straddle)) {
    for (const idx of straddle) {
      if (!spans.some((span) => span[0] === idx)) throw new Error(`panorama straddle ${idx} is not the first screen of a span`);
    }
  }
  return spans;
}
function composeSet(plan) {
  const style = plan.style ?? {};
  const warnings = [];
  const bleedPref = COMPOSE_BLEEDS.includes(style.bleed ?? "") ? style.bleed : "auto";
  const font = style.font && COMPOSE_FONTS.includes(style.font) ? style.font : "Inter";
  const tiltScreens = new Set(style.tiltScreens ?? []);
  const explicit = plan.canvasWidth != null || plan.canvasHeight != null;
  const dims = plan.screens.map((screen) => {
    if (!getDeviceFrame(screen.deviceId)) throw new Error(`Unknown device: ${screen.deviceId}`);
    const { width, height } = explicit ? { width: plan.canvasWidth ?? 280, height: plan.canvasHeight ?? 600 } : canvasDimsForDevice(screen.deviceId);
    return { W: width, H: height };
  });
  const spans = validateSpans(plan, dims);
  const spanOf = /* @__PURE__ */ new Map();
  for (const span of spans) span.forEach((idx, k) => spanOf.set(idx, { span, k }));
  const typoByDims = /* @__PURE__ */ new Map();
  const dimsKey = (d) => `${d.W}x${d.H}`;
  plan.screens.forEach((_, i) => {
    const key = dimsKey(dims[i]);
    if (typoByDims.has(key)) return;
    const { W, H } = dims[i];
    const unit = Math.min(W, H * TYPE_UNIT_HEIGHT_CAP);
    const headlineSize = unit * HEADLINE_SIZE;
    const hasBadge = plan.screens.some((s, j) => dimsKey(dims[j]) === key && !!s.badge?.trim());
    const badgeFont = headlineSize * BADGE_FONT;
    typoByDims.set(key, {
      W,
      H,
      unit,
      headlineSize,
      subSize: headlineSize * SUBHEADLINE_RATIO,
      textWidth: W * TEXT_WIDTH,
      margin: H * EDGE_MARGIN,
      deviceGap: unit * DEVICE_GAP,
      badgeFont,
      font,
      badgeRow: hasBadge ? badgeFont * BADGE_HEIGHT + headlineSize * BADGE_GAP : 0,
      textArea: 0
    });
  });
  const resolved = plan.screens.map((screen, i) => {
    const typo = typoByDims.get(dimsKey(dims[i]));
    const block = measureTextBlock(screen, typo);
    typo.textArea = Math.max(typo.textArea, block.height);
    const presentation = COMPOSE_PRESENTATIONS.includes(screen.presentation ?? "") ? screen.presentation : COMPOSE_PRESENTATIONS.includes(style.presentation ?? "") ? style.presentation : "device";
    let layout = screen.layout && LAYOUTS[screen.layout] ? screen.layout : "text-top";
    if (presentation === "zoom" && layout === "device-bleed") layout = "text-top";
    const rawTilt = typeof screen.tilt === "number" ? screen.tilt : tiltScreens.has(i) ? style.tilt ?? 0 : 0;
    const tilt = Number.isFinite(rawTilt) ? Math.max(-30, Math.min(30, rawTilt)) : 0;
    const fromPalette = screen.background ? null : paletteBackground(style.palette, i);
    const background = screen.background ?? fromPalette ?? { type: "solid", color: "#1F2937" };
    const backgroundFromStyle = !screen.background;
    const subjectKey = presentation === "device" ? screen.deviceId : presentation === "frameless" ? `shot:${screen.screenshot.width}x${screen.screenshot.height}` : "card";
    const group = `${dims[i].W}x${dims[i].H}|${presentation}|${subjectKey}|${layout}|tilt:${tilt}`;
    return {
      index: i,
      plan: screen,
      W: dims[i].W,
      H: dims[i].H,
      layout,
      presentation,
      tilt,
      background,
      backgroundFromStyle,
      typo,
      block,
      group
    };
  });
  const straddleSpec = style.panorama?.straddle;
  const wantsStraddle = new Set(
    straddleSpec ? spans.map((span) => span[0]).filter((i) => (Array.isArray(straddleSpec) ? straddleSpec.includes(i) : true) && resolved[i].presentation !== "zoom") : []
  );
  for (const i of wantsStraddle) resolved[i].group += "|straddle";
  const groups = /* @__PURE__ */ new Map();
  for (const r of resolved) groups.set(r.group, [...groups.get(r.group) ?? [], r]);
  const placements = /* @__PURE__ */ new Map();
  for (const members of groups.values()) {
    const asStraddle = members.every((m) => wantsStraddle.has(m.index));
    for (const [i, p] of placeGroup(members, bleedPref, warnings, asStraddle)) placements.set(i, p);
  }
  const straddle = /* @__PURE__ */ new Map();
  if (wantsStraddle.size) {
    for (const span of spans) {
      const i = span[0];
      if (!wantsStraddle.has(i)) continue;
      const r = resolved[i];
      const p = placements.get(i);
      if (r.presentation === "zoom") continue;
      const W = r.W;
      const dx = p.straddleDx;
      const focus = normalizeFocus(r.plan.focus);
      if (dx == null) {
        warnings.push({
          screen: i,
          code: "straddle-skipped",
          message: `screen ${i + 1}: device kept inside its screen \u2014 crossing the seam would put its focus band across it (or break the side margin)`
        });
        continue;
      }
      if (!focus) {
        warnings.push({
          screen: i,
          code: "panorama-seam",
          message: `screen ${i + 1}: the device crosses the seam into screen ${i + 2} but has no \`focus\` band marked \u2014 mark one so the selling UI provably stays on screen ${i + 1}`
        });
      }
      straddle.set(i, { cx: W / 2 + dx, into: span[1] });
    }
  }
  const spanFills = /* @__PURE__ */ new Map();
  for (const span of spans) {
    const r0 = resolved[span[0]];
    spanFills.set(span[0], spanFillFor(r0.background, span[0], span.length, r0.W, r0.H));
  }
  const textBand = (r) => {
    const top = r.layout === "text-bottom" ? r.H - r.typo.margin - r.typo.textArea : r.typo.margin;
    const gap = ORB_TEXT_GAP * r.H;
    return { top: top - gap, bottom: top + r.typo.textArea + gap };
  };
  const orbFor = (span, seam) => {
    const a = resolved[span[seam - 1]];
    const b = resolved[span[seam]];
    const H = a.H;
    const blocks = [textBand(a), textBand(b)].sort((x, y) => x.top - y.top);
    const free = [];
    let cursor = 0;
    for (const t of blocks) {
      if (t.top > cursor) free.push({ lo: cursor, hi: t.top });
      cursor = Math.max(cursor, t.bottom);
    }
    if (cursor < H) free.push({ lo: cursor, hi: H });
    const want = ORB_Y * H;
    const pick = free.find((f) => f.lo <= want && want <= f.hi) ?? free.sort((x, y) => y.hi - y.lo - (x.hi - x.lo))[0];
    if (!pick) return null;
    const lo = pick.lo === 0 ? -Infinity : pick.lo;
    const hi = pick.hi === H ? Infinity : pick.hi;
    const r = Math.min(ORB_RADIUS * a.W, (hi - lo) / 2);
    if (!(r >= ORB_MIN_RADIUS * a.W)) return null;
    const cy = Math.min(Math.max(want, lo + r), hi - r);
    return { cy, r };
  };
  const metrics = [];
  const textRectsByScreen = /* @__PURE__ */ new Map();
  const screens = resolved.map((r) => {
    const { W, H, typo, block, plan: screen } = r;
    const p = placements.get(r.index);
    const layers = [];
    let background = r.background;
    const inSpan = spanOf.get(r.index);
    if (inSpan) {
      const { span, k } = inSpan;
      const N = span.length;
      const fill = spanFills.get(span[0]);
      background = { type: "solid", color: fill.kind === "solid" ? fill.color : fill.stops[0].color };
      const bg = makeShapeLayer({
        shape: "rectangle",
        left: N * W / 2 - k * W,
        top: H / 2,
        width: N * W,
        height: H,
        name: `Panorama background (${k + 1}/${N})`,
        locked: true
      });
      Object.assign(bg.fabricData, {
        fill: fill.kind === "solid" ? fill.color : {
          type: "linear",
          gradientUnits: "pixels",
          coords: { ...fill.coords },
          colorStops: fill.stops.map((s) => ({ offset: s.offset, color: s.color })),
          offsetX: 0,
          offsetY: 0
        },
        selectable: false,
        evented: false
      });
      layers.push(bg);
      if ((style.panorama?.decoration ?? "orbs") === "orbs") {
        for (let seam = 1; seam < N; seam++) {
          if (seam !== k && seam !== k + 1) continue;
          const orb = orbFor(span, seam);
          if (!orb) continue;
          layers.push(
            makeShapeLayer({
              shape: "circle",
              left: seam * W - k * W,
              top: orb.cy,
              radius: orb.r,
              fill: "rgba(255,255,255,0.14)",
              name: "Panorama orb"
            })
          );
        }
      }
    }
    for (const [from, s] of straddle) {
      if (s.into !== r.index) continue;
      const fr = resolved[from];
      const fp = placements.get(from);
      const cont = makeSubjectLayer(fr, fp, s.cx - W, `${getDeviceFrame(fr.plan.deviceId)?.name ?? "Screenshot"} (continued)`);
      layers.push(cont);
    }
    const cx = straddle.get(r.index)?.cx ?? p.cx;
    layers.push(makeSubjectLayer(r, p, cx));
    const areaTop = r.layout === "text-bottom" ? H - typo.margin - typo.textArea : typo.margin;
    const rects = {
      headline: { left: (W - typo.textWidth) / 2, top: 0, right: (W + typo.textWidth) / 2, bottom: 0 }
    };
    const blockBottom = areaTop + typo.badgeRow + block.headlineHeight + block.gap + block.subHeight;
    const samples = [];
    for (const fx of [0.1, 0.5, 0.9]) {
      for (const fy of [0, 0.5, 1]) {
        const x = fx * W;
        const y = areaTop + fy * (blockBottom - areaTop);
        samples.push(inSpan ? samplePanorama(spanFills.get(inSpan.span[0]), inSpan.k, W, x, y) : sampleBackground(r.background, W, H, x, y));
      }
    }
    const headlineColor = screen.headlineColor ?? (inSpan || r.backgroundFromStyle ? readableTextOn(samples) : "#ffffff");
    if (screen.badge?.trim()) {
      const text = screen.badge.trim();
      if (text.length > BADGE_MAX_CHARS) {
        warnings.push({ screen: r.index, code: "badge-long", message: `screen ${r.index + 1}: badge "${text}" is long \u2014 keep it to 1\u20133 words` });
      }
      const fontSize = typo.badgeFont;
      const pillH = fontSize * BADGE_HEIGHT;
      const pillW = Math.min(typo.textWidth, estimateTextWidth(text, fontSize, typo.font) + 2 * BADGE_PAD_X * fontSize);
      const cy = areaTop + pillH / 2;
      const pill = makeShapeLayer({
        shape: "rectangle",
        left: W / 2,
        top: cy,
        width: pillW,
        height: pillH,
        rx: pillH / 2,
        ry: pillH / 2,
        fill: rgba(isHexColor(headlineColor) ? headlineColor : "#ffffff", 0.18),
        name: "Badge"
      });
      const label = makeTextLayer({
        text,
        left: W / 2,
        top: cy,
        width: pillW,
        fontSize,
        fontFamily: font,
        fontWeight: "700",
        lineHeight: 1,
        fill: headlineColor,
        textAlign: "center",
        name: "Badge text",
        templateRole: "editable",
        templateKey: "badge"
      });
      layers.push(pill, label);
      rects.badge = { left: W / 2 - pillW / 2, top: areaTop, right: W / 2 + pillW / 2, bottom: areaTop + pillH };
    }
    const headlineTop = areaTop + typo.badgeRow;
    rects.headline.top = headlineTop;
    rects.headline.bottom = headlineTop + block.headlineHeight;
    layers.push(
      makeTextLayer({
        text: screen.headline,
        left: W / 2,
        top: headlineTop + block.headlineHeight / 2,
        width: typo.textWidth,
        fontSize: typo.headlineSize,
        fontFamily: font,
        fontWeight: "800",
        lineHeight: HEADLINE_LINE_HEIGHT,
        fill: headlineColor,
        textAlign: "center",
        name: "Headline",
        templateRole: "editable",
        templateKey: "headline"
      })
    );
    if (screen.subheadline?.trim()) {
      const subTop = headlineTop + block.headlineHeight + block.gap;
      const sub = makeTextLayer({
        text: screen.subheadline,
        left: W / 2,
        top: subTop + block.subHeight / 2,
        width: typo.textWidth,
        fontSize: typo.subSize,
        fontFamily: font,
        fontWeight: "500",
        lineHeight: SUBHEADLINE_LINE_HEIGHT,
        fill: screen.subheadlineColor ?? headlineColor,
        textAlign: "center",
        name: "Subheadline",
        templateRole: "editable",
        templateKey: "subheadline"
      });
      if (!screen.subheadlineColor) sub.fabricData.opacity = SUBHEADLINE_OPACITY;
      layers.push(sub);
      rects.sub = { left: rects.headline.left, top: subTop, right: rects.headline.right, bottom: subTop + block.subHeight };
    }
    textRectsByScreen.set(r.index, rects);
    const top = p.cy - p.boxHeight / 2;
    const bottom = p.cy + p.boxHeight / 2;
    const overshoot = r.layout === "text-bottom" ? -top : bottom - H;
    metrics.push({
      index: r.index,
      presentation: r.presentation,
      layout: r.layout,
      group: r.group,
      scale: p.scale,
      widthFraction: p.subject.width * p.scale / W,
      top: top / H,
      bottom: bottom / H,
      overshoot: overshoot / H,
      bleedFraction: p.boxHeight > 0 ? overshoot / p.boxHeight : 0,
      mode: overshoot > 0 ? "bleed" : "clear",
      tangent: inTangentZone(overshoot, p.boxHeight, H),
      headlineSize: typo.headlineSize / W,
      headlineTop: headlineTop / H,
      tilt: p.angle,
      centerX: cx / W
    });
    return makeScreen({
      background,
      canvasWidth: W,
      canvasHeight: H,
      // Tag the device GROUP (multi-device) so a mixed plan lands as separate sidebar groups in
      // the editor instead of relying on frame inference. Absent ⇒ editor infers it.
      deviceClass: deviceClassForDeviceId(screen.deviceId) ?? void 0,
      layers
    });
  });
  resolved.forEach((r) => {
    const words = r.plan.headline.trim().split(/\s+/).filter(Boolean).length;
    const n = r.index + 1;
    if (words > COPY_RULES.headlineMaxWords) {
      warnings.push({ screen: r.index, code: "headline-words", message: `screen ${n}: headline has ${words} words (aim for 3\u20135) \u2014 cut, don't shrink` });
    }
    if (r.block.headlineLines > COPY_RULES.headlineMaxLines) {
      warnings.push({
        screen: r.index,
        code: "headline-lines",
        message: `screen ${n}: headline wraps to ~${r.block.headlineLines} lines at the set size (max 2) \u2014 it grows the text area for EVERY screen`
      });
    }
    if (r.block.subLines > COPY_RULES.subheadlineMaxLines) {
      warnings.push({
        screen: r.index,
        code: "subheadline-lines",
        message: `screen ${n}: subheadline wraps to ~${r.block.subLines} lines (max 1) \u2014 shorten it or drop it`
      });
    }
    const p = placements.get(r.index);
    if (p.zoom?.focusCropped) {
      warnings.push({ screen: r.index, code: "zoom-focus-cropped", message: `screen ${n}: the zoom card can't show the whole focus band \u2014 mark a tighter \`crop\`` });
    }
  });
  if (straddle.size > MAX_STRADDLES) {
    warnings.push({
      code: "panorama-straddle-count",
      message: `${straddle.size} devices cross a seam \u2014 keep it to ${MAX_STRADDLES} per set (usually the hero) so the set stays calm`
    });
  }
  const tilted = resolved.filter((r) => r.tilt !== 0).length;
  if (tilted > COPY_RULES.maxTiltedScreens) {
    warnings.push({ code: "tilt-count", message: `${tilted} screens are tilted \u2014 rotation is an accent: use it on at most ${COPY_RULES.maxTiltedScreens}` });
  }
  for (const [from, s] of straddle) {
    const fr = resolved[from];
    const fp = placements.get(from);
    for (const [screenIdx, cx] of [
      [from, s.cx],
      [s.into, s.cx - fr.W]
    ]) {
      const box = { left: cx - fp.boxWidth / 2, right: cx + fp.boxWidth / 2, top: fp.cy - fp.boxHeight / 2, bottom: fp.cy + fp.boxHeight / 2 };
      const t = textRectsByScreen.get(screenIdx);
      if ([t.headline, t.sub, t.badge].some((rect) => rect && rectsOverlap(rect, box))) {
        warnings.push({ screen: screenIdx, code: "panorama-seam", message: `screen ${screenIdx + 1}: the straddling device overlaps the text` });
      }
    }
    const poly = focusPolygon(fr, fp, s.cx);
    if (poly && Math.max(...poly.map((pt) => pt.x)) > fr.W) {
      warnings.push({ screen: from, code: "panorama-seam", message: `screen ${from + 1}: the seam crosses the focus band` });
    }
  }
  metrics.sort((a, b) => a.index - b.index);
  return { template: makeTemplate({ name: plan.name, screens, tags: ["generated"] }), report: { warnings, screens: metrics } };
}

// node_modules/@appshoteditor/shot-dsl/src/variants.ts
var VARIANT_LABELS = { A: "Framed", B: "Frameless", C: "Panorama" };
var VARIANT_HERO_TILT = 8;
var VARIANT_ZOOM_MAX_FOCUS = 0.45;
var suffix = (name, key) => `${name} \u2014 ${key} ${VARIANT_LABELS[key]}`;
function baseScreen(screen) {
  const copy = JSON.parse(JSON.stringify(screen));
  delete copy.layout;
  delete copy.presentation;
  delete copy.tilt;
  return { ...copy, layout: "text-top" };
}
function baseStyle(style) {
  const out = { bleed: style?.bleed ?? "auto" };
  if (style?.palette) out.palette = JSON.parse(JSON.stringify(style.palette));
  if (style?.font) out.font = style.font;
  return out;
}
function panoramaPairs(plan) {
  const explicit = plan.canvasWidth != null || plan.canvasHeight != null;
  const key = (s) => {
    if (explicit) return "explicit";
    const d = canvasDimsForDevice(s.deviceId);
    return `${d.width}x${d.height}`;
  };
  const spans = [];
  for (let i = 0; i + 1 < plan.screens.length; ) {
    if (key(plan.screens[i]) === key(plan.screens[i + 1])) {
      spans.push([i, i + 1]);
      i += 2;
    } else {
      i += 1;
    }
  }
  return spans;
}
function makeVariants(plan) {
  const common = { canvasWidth: plan.canvasWidth, canvasHeight: plan.canvasHeight };
  const strip = (o) => JSON.parse(JSON.stringify(o));
  const a = strip({
    ...common,
    name: suffix(plan.name, "A"),
    style: { ...baseStyle(plan.style), presentation: "device" },
    screens: plan.screens.map(baseScreen)
  });
  const b = strip({
    ...common,
    name: suffix(plan.name, "B"),
    style: { ...baseStyle(plan.style), presentation: "frameless" },
    screens: plan.screens.map((screen) => {
      const s = baseScreen(screen);
      const f = screen.focus;
      const tight = !!f && Math.abs(f.bottom - f.top) <= VARIANT_ZOOM_MAX_FOCUS;
      if (screen.crop || tight) s.presentation = "zoom";
      return s;
    })
  });
  const pano = plan.style?.panorama;
  const spans = pano?.spans?.length ? JSON.parse(JSON.stringify(pano.spans)) : panoramaPairs(plan);
  const heroStraddle = spans.some((span) => span[0] === 0) ? [0] : [];
  const c = strip({
    ...common,
    name: suffix(plan.name, "C"),
    style: {
      ...baseStyle(plan.style),
      presentation: "device",
      tilt: plan.style?.tilt ? plan.style.tilt : VARIANT_HERO_TILT,
      tiltScreens: [0],
      // Only the hero straddles by default (≤ 1 seam crossing per set); other spans keep the
      // continuous background + orbs with centred, straight devices.
      panorama: { spans, straddle: pano?.straddle ?? heroStraddle, decoration: pano?.decoration ?? "orbs" }
    },
    screens: plan.screens.map(baseScreen)
  });
  return [
    { key: "A", label: VARIANT_LABELS.A, plan: a },
    { key: "B", label: VARIANT_LABELS.B, plan: b },
    { key: "C", label: VARIANT_LABELS.C, plan: c }
  ];
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
  return new Promise((resolve2) => setTimeout(resolve2, ms));
}
var MAX_RETRIES = 3;
var TIMEOUT_OVERRIDE_MS = Number(process.env.APPSHOTEDITOR_TIMEOUT_MS) > 0 ? Number(process.env.APPSHOTEDITOR_TIMEOUT_MS) : 0;
var FETCH_TIMEOUT_MS = TIMEOUT_OVERRIDE_MS || 3e4;
function uploadTimeoutMs(bytes) {
  return TIMEOUT_OVERRIDE_MS || 3e4 + Math.ceil(bytes / 62500) * 1e3;
}
var TRANSIENT_STATUS = /* @__PURE__ */ new Set([429, 500, 502, 503, 504]);
async function postWithRetry(url, init, timeoutMs = FETCH_TIMEOUT_MS) {
  for (let attempt = 1; ; attempt++) {
    let res;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(new DOMException("request timed out", "TimeoutError")), timeoutMs);
    try {
      res = await fetch(url, { ...init, signal: controller.signal });
    } catch (err) {
      const e = err;
      const reason = e?.name === "TimeoutError" ? `no response within ${Math.round(timeoutMs / 1e3)}s (set APPSHOTEDITOR_TIMEOUT_MS to allow longer)` : e?.message || String(err);
      if (attempt > MAX_RETRIES) throw new Error(`network error talking to ${BASE}: ${reason}`);
      const wait = 2 ** (attempt - 1);
      console.error(`appshot: network error (${reason}) \u2014 retrying in ${wait}s (retry ${attempt}/${MAX_RETRIES})`);
      await sleep(wait * 1e3);
      continue;
    } finally {
      clearTimeout(timer);
    }
    if (!TRANSIENT_STATUS.has(res.status) || attempt > MAX_RETRIES) return res;
    let waitSeconds = 2 ** (attempt - 1);
    if (res.status === 429) {
      const retryAfter = Number(res.headers.get("retry-after"));
      waitSeconds = Math.min(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 5, 60);
    }
    console.error(`appshot: server returned ${res.status} \u2014 waiting ${waitSeconds}s (retry ${attempt}/${MAX_RETRIES})`);
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
    const res = await postWithRetry(`${BASE}/api/screenshots`, { method: "POST", headers, body: form }, uploadTimeoutMs(buf.length));
    if (!res.ok) {
      flushPartialManifest();
      fail(explainUploadError(file, res.status, await res.text()));
    }
    const { asset } = await res.json();
    assets.push({ ...asset, filename: name });
  }
  console.log(JSON.stringify({ assets }, null, 2));
}
var SCREEN_KEYS = /* @__PURE__ */ new Set([
  "headline",
  "headlineColor",
  "subheadline",
  "subheadlineColor",
  "layout",
  "background",
  "deviceId",
  "screenshot",
  "focus",
  "crop",
  "presentation",
  "tilt",
  "badge"
]);
var PLAN_KEYS = /* @__PURE__ */ new Set(["name", "screens", "canvasWidth", "canvasHeight", "style"]);
var STYLE_KEYS = /* @__PURE__ */ new Set(["presentation", "tilt", "tiltScreens", "bleed", "palette", "panorama", "font"]);
var HEX2 = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
function validatePlan(plan) {
  const errors = [];
  const isObj = (v) => !!v && typeof v === "object" && !Array.isArray(v);
  const optString = (v, at) => {
    if (v !== void 0 && typeof v !== "string") errors.push(`${at} must be a string`);
  };
  const posNumber = (v, at) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v <= 0) errors.push(`${at} must be a positive number`);
  };
  const fraction = (v, at) => {
    if (typeof v !== "number" || !Number.isFinite(v) || v < 0 || v > 1) errors.push(`${at} must be a number from 0 to 1`);
  };
  const tiltValue = (v, at) => {
    if (typeof v !== "number" || !Number.isFinite(v) || Math.abs(v) > 30) errors.push(`${at} must be a number of degrees from -30 to 30`);
  };
  if (!isObj(plan)) return ["plan must be a JSON object"];
  for (const key of Object.keys(plan)) if (!PLAN_KEYS.has(key)) errors.push(`unknown plan field "${key}"`);
  const screenCount = Array.isArray(plan.screens) ? plan.screens.length : 0;
  const index = (v, at) => {
    if (!Number.isInteger(v) || v < 0 || v >= screenCount) {
      errors.push(`${at} must be a screen index from 0 to ${screenCount - 1}`);
    }
  };
  let hasPalette = false;
  if (plan.style !== void 0) {
    const style = plan.style;
    if (!isObj(style)) {
      errors.push("style must be an object");
    } else {
      for (const key of Object.keys(style)) if (!STYLE_KEYS.has(key)) errors.push(`unknown style field "${key}"`);
      if (style.presentation !== void 0 && !COMPOSE_PRESENTATIONS.includes(style.presentation)) {
        errors.push(`style.presentation must be one of ${COMPOSE_PRESENTATIONS.join(", ")}`);
      }
      if (style.bleed !== void 0 && !COMPOSE_BLEEDS.includes(style.bleed)) {
        errors.push(`style.bleed must be one of ${COMPOSE_BLEEDS.join(", ")}`);
      }
      if (style.tilt !== void 0) tiltValue(style.tilt, "style.tilt");
      if (style.tiltScreens !== void 0) {
        if (!Array.isArray(style.tiltScreens)) errors.push("style.tiltScreens must be an array of screen indices");
        else style.tiltScreens.forEach((v, k) => index(v, `style.tiltScreens[${k}]`));
      }
      if (style.font !== void 0 && !COMPOSE_FONTS.includes(style.font)) {
        errors.push(`style.font must be one of: ${COMPOSE_FONTS.join(", ")}`);
      }
      if (style.palette !== void 0) {
        const pal = style.palette;
        if (!isObj(pal) || !["family", "sequence"].includes(pal.mode)) {
          errors.push('style.palette must be { mode: "family" | "sequence", colors: [hex\u2026] }');
        } else if (!Array.isArray(pal.colors) || pal.colors.length === 0 || !pal.colors.every((c) => typeof c === "string" && HEX2.test(c))) {
          errors.push("style.palette.colors must be a non-empty array of #rgb / #rrggbb hex colors");
        } else {
          hasPalette = true;
        }
        if (isObj(pal)) {
          for (const key of Object.keys(pal)) if (!["mode", "colors"].includes(key)) errors.push(`unknown style.palette field "${key}"`);
        }
      }
      if (style.panorama !== void 0) {
        const pano = style.panorama;
        if (!isObj(pano) || !Array.isArray(pano.spans)) {
          errors.push("style.panorama must be { spans: [[i, i+1], \u2026], straddle?, decoration? }");
        } else {
          for (const key of Object.keys(pano)) if (!["spans", "straddle", "decoration"].includes(key)) errors.push(`unknown style.panorama field "${key}"`);
          const seen = /* @__PURE__ */ new Set();
          pano.spans.forEach((span, k) => {
            const at = `style.panorama.spans[${k}]`;
            if (!Array.isArray(span) || span.length < 2) {
              errors.push(`${at} must list at least 2 adjacent screen indices`);
              return;
            }
            span.forEach((v, j) => {
              index(v, `${at}[${j}]`);
              if (j > 0 && v !== span[j - 1] + 1) errors.push(`${at} must be adjacent ascending indices (e.g. [0, 1])`);
              if (seen.has(v)) errors.push(`${at}: screen ${v} is already in another span`);
              seen.add(v);
            });
          });
          if (Array.isArray(pano.straddle)) {
            const starts = new Set(pano.spans.map((span) => Array.isArray(span) ? span[0] : void 0));
            pano.straddle.forEach((v, k) => {
              if (!starts.has(v)) errors.push(`style.panorama.straddle[${k}] must be the first screen index of a span`);
            });
          } else if (pano.straddle !== void 0 && typeof pano.straddle !== "boolean") {
            errors.push("style.panorama.straddle must be true/false or a list of span-start screen indices");
          }
          if (pano.decoration !== void 0 && !["orbs", "none"].includes(pano.decoration)) {
            errors.push('style.panorama.decoration must be "orbs" or "none"');
          }
        }
      }
    }
  }
  if (typeof plan.name !== "string" || !plan.name) errors.push("name must be a non-empty string");
  if (plan.canvasWidth !== void 0) posNumber(plan.canvasWidth, "canvasWidth");
  if (plan.canvasHeight !== void 0) posNumber(plan.canvasHeight, "canvasHeight");
  if (plan.canvasWidth === void 0 !== (plan.canvasHeight === void 0)) {
    errors.push("set both canvasWidth and canvasHeight, or (recommended) omit both");
  }
  if (!Array.isArray(plan.screens) || plan.screens.length === 0) {
    errors.push("screens must be a non-empty array");
    return errors;
  }
  plan.screens.forEach((screen, i) => {
    const at = `screens[${i}]`;
    if (!isObj(screen)) {
      errors.push(`${at} must be an object`);
      return;
    }
    for (const key of Object.keys(screen)) if (!SCREEN_KEYS.has(key)) errors.push(`${at}: unknown field "${key}"`);
    if (typeof screen.headline !== "string" || !screen.headline.trim()) {
      errors.push(`${at}.headline must be a non-empty string`);
    }
    optString(screen.headlineColor, `${at}.headlineColor`);
    optString(screen.subheadline, `${at}.subheadline`);
    optString(screen.subheadlineColor, `${at}.subheadlineColor`);
    if (screen.layout !== void 0 && !COMPOSE_LAYOUTS.includes(screen.layout)) {
      errors.push(`${at}.layout must be one of ${COMPOSE_LAYOUTS.join(", ")} (got ${JSON.stringify(screen.layout)})`);
    }
    if (typeof screen.deviceId !== "string" || !getDeviceFrame(screen.deviceId)) {
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
    if (screen.background === void 0 && hasPalette) {
    } else if (!isObj(screen.background) || !["solid", "gradient"].includes(screen.background.type)) {
      errors.push(`${at}.background.type must be "solid" or "gradient" (or omit it and set style.palette)`);
    }
    if (screen.focus !== void 0) {
      if (!isObj(screen.focus)) errors.push(`${at}.focus must be { top, bottom } (fractions of the screenshot height)`);
      else {
        fraction(screen.focus.top, `${at}.focus.top`);
        fraction(screen.focus.bottom, `${at}.focus.bottom`);
        if (typeof screen.focus.top === "number" && typeof screen.focus.bottom === "number" && screen.focus.bottom <= screen.focus.top) {
          errors.push(`${at}.focus.bottom must be greater than focus.top`);
        }
      }
    }
    if (screen.crop !== void 0) {
      if (!isObj(screen.crop)) errors.push(`${at}.crop must be { x, y, w, h } (fractions of the screenshot)`);
      else {
        for (const k of ["x", "y", "w", "h"]) fraction(screen.crop[k], `${at}.crop.${k}`);
        const c = screen.crop;
        if (c.w <= 0 || c.h <= 0) errors.push(`${at}.crop.w and crop.h must be greater than 0`);
        if (c.x + c.w > 1.0001 || c.y + c.h > 1.0001) errors.push(`${at}.crop must stay inside the screenshot (x + w \u2264 1, y + h \u2264 1)`);
      }
    }
    if (screen.presentation !== void 0 && !COMPOSE_PRESENTATIONS.includes(screen.presentation)) {
      errors.push(`${at}.presentation must be one of ${COMPOSE_PRESENTATIONS.join(", ")}`);
    }
    if (screen.tilt !== void 0) tiltValue(screen.tilt, `${at}.tilt`);
    if (screen.badge !== void 0 && (typeof screen.badge !== "string" || !screen.badge.trim() || screen.badge.length > 40)) {
      errors.push(`${at}.badge must be a short non-empty string (\u2264 40 chars)`);
    }
  });
  return errors;
}
function readPlan(path) {
  if (!path) fail("expected a plan.json path");
  let plan;
  try {
    plan = JSON.parse(readFileSync(path, "utf8"));
  } catch (err) {
    fail(`could not read ${path}: ${err.message}`);
  }
  const errors = validatePlan(plan);
  if (errors.length) fail(`invalid plan (${path}):
  - ${errors.join("\n  - ")}`);
  return plan;
}
function buildTemplate(plan, opts) {
  let composed;
  try {
    composed = composeSet(plan);
  } catch (err) {
    fail(`${opts.label ? `${opts.label}: ` : ""}could not compose: ${err.message}`);
  }
  const { template, report } = composed;
  const result = validateTemplate(template);
  if (!result.valid) fail(`composed template is invalid: ${result.errors.join("; ")}`);
  printWarnings(report.warnings, opts.label);
  if (opts.strict && report.warnings.length > 0) {
    fail(`${opts.label ? `${opts.label}: ` : ""}${report.warnings.length} warning(s) with --strict \u2014 fix the plan and re-run`);
  }
  return template;
}
function safeCompose(plan, label) {
  try {
    return composeSet(plan);
  } catch (err) {
    fail(`${label}: could not compose: ${err.message}`);
  }
}
function printWarnings(warnings, label) {
  for (const w of warnings) console.error(`appshot: warning${label ? ` (${label})` : ""} [${w.code}] ${w.message}`);
}
function parseArgs(argv) {
  const positional = [];
  let strict = false;
  let variants2 = false;
  let force = false;
  let out;
  let only;
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--strict") strict = true;
    else if (a === "--variants") variants2 = true;
    else if (a === "--force") force = true;
    else if (a === "--out") {
      out = argv[++i];
      if (!out) fail("--out needs a directory");
    } else if (a === "--only") {
      const list = argv[++i];
      if (!list) fail("--only needs a comma-separated list, e.g. --only B,C");
      only = list.split(",").map((k) => k.trim().toUpperCase()).filter(Boolean);
      if (only.length === 0) fail("--only needs at least one concept, e.g. --only B,C");
    } else if (a.startsWith("--")) fail(`unknown flag ${a}`);
    else positional.push(a);
  }
  return { positional, strict, variants: variants2, force, out, only };
}
function compose(argv) {
  const { positional, strict } = parseArgs(argv);
  if (positional.length !== 1) fail("compose takes exactly one plan.json");
  console.log(JSON.stringify(buildTemplate(readPlan(positional[0]), { strict })));
}
function lint(argv) {
  const { positional, strict } = parseArgs(argv);
  if (positional.length === 0) fail("lint: provide one or more plan.json files");
  let warningsTotal = 0;
  let invalid = 0;
  for (const path of positional) {
    const plan = readPlan(path);
    const { template, report } = safeCompose(plan, path);
    const result = validateTemplate(template);
    const label = positional.length > 1 ? basename(path) : void 0;
    printWarnings(report.warnings, label);
    warningsTotal += report.warnings.length;
    if (!result.valid) {
      invalid++;
      console.log(`${basename(path)}: INVALID \u2014 ${result.errors.join("; ")}`);
    } else {
      console.log(`${basename(path)}: ${report.warnings.length === 0 ? "OK \u2014 no warnings" : `valid, ${report.warnings.length} warning(s)`}`);
    }
  }
  if (invalid > 0 || strict && warningsTotal > 0) process.exit(1);
}
function variants(argv) {
  const { positional, out, strict, force } = parseArgs(argv);
  if (positional.length !== 1) fail("variants takes exactly one plan.json");
  const input = resolve(positional[0]);
  const plan = readPlan(positional[0]);
  const dir = resolve(out ?? dirname(positional[0]));
  const outputs = makeVariants(plan).map((v) => ({ v, file: join(dir, `plan-${v.key}.json`) }));
  const self = outputs.find((o) => o.file === input);
  if (self) fail(`refusing to overwrite the input plan ${input} \u2014 pass --out <another dir> (or rename the input)`);
  const existing = outputs.filter((o) => existsSync(o.file)).map((o) => o.file);
  if (existing.length && !force) fail(`refusing to overwrite existing ${existing.join(", ")} \u2014 pass --force to replace them`);
  const composed = outputs.map((o) => ({ ...o, report: safeCompose(o.v.plan, `plan-${o.v.key}`).report }));
  for (const c of composed) {
    const result = validateTemplate(safeCompose(c.v.plan, `plan-${c.v.key}`).template);
    if (!result.valid) fail(`plan-${c.v.key}: composed template is invalid: ${result.errors.join("; ")}`);
  }
  if (strict) {
    const warned = composed.filter((c) => c.report.warnings.length > 0);
    for (const c of warned) printWarnings(c.report.warnings, `plan-${c.v.key}`);
    if (warned.length) fail(`${warned.map((c) => `plan-${c.v.key}`).join(", ")} have warnings with --strict \u2014 nothing written; fix the base plan and re-run`);
  }
  mkdirSync(dir, { recursive: true });
  for (const c of composed) {
    writeFileSync(c.file, JSON.stringify(c.v.plan, null, 2) + "\n");
    console.log(`${c.file}  (${c.v.key} ${c.v.label}, ${c.report.warnings.length} warning(s))`);
  }
}
function shellQuote(value) {
  return /^[A-Za-z0-9_./:@%+=,-]+$/.test(value) ? value : `'${value.replace(/'/g, `'\\''`)}'`;
}
async function postHandoff(template) {
  try {
    const res = await postWithRetry(`${BASE}/api/handoffs`, {
      method: "POST",
      headers: { ...authHeaders(), "content-type": "application/json" },
      body: JSON.stringify({ template })
    });
    if (!res.ok) return { ok: false, error: `${res.status} ${(await res.text()).slice(0, 300)}` };
    const { url } = await res.json();
    return { ok: true, url };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  }
}
async function publish(argv) {
  const { positional, strict, variants: asVariants, only } = parseArgs(argv);
  if (positional.length === 0) fail("publish: provide one or more plan.json files");
  const jobs = [];
  if (asVariants) {
    if (positional.length !== 1) fail("publish --variants takes exactly one plan.json");
    const all = makeVariants(readPlan(positional[0]));
    const unknown = (only ?? []).filter((k) => !all.some((v) => v.key === k));
    if (unknown.length) fail(`--only: unknown concept(s) ${unknown.join(", ")} \u2014 use A, B and/or C`);
    for (const v of all) {
      if (only && !only.includes(v.key)) continue;
      const label = `${v.key} ${v.label}`;
      jobs.push({ key: v.key, label, template: buildTemplate(v.plan, { strict, label }) });
    }
  } else {
    if (only) fail("--only works with --variants; to retry specific plans, pass just those plan files");
    for (const path of positional) {
      const label = basename(path);
      jobs.push({ key: path, label, template: buildTemplate(readPlan(path), { strict, label: positional.length > 1 ? label : void 0 }) });
    }
  }
  if (jobs.length === 1) {
    const r = await postHandoff(jobs[0].template);
    if (!r.ok) fail(`handoff failed${positional.length > 1 || asVariants ? ` (${jobs[0].label})` : ""}: ${r.error}`);
    console.log(r.url);
    return;
  }
  const failed = [];
  for (const job of jobs) {
    const r = await postHandoff(job.template);
    if (r.ok) console.log(`${job.label}: ${r.url}`);
    else {
      failed.push(job);
      console.error(`appshot: ${job.label}: FAILED \u2014 ${r.error}`);
    }
  }
  if (failed.length) {
    const done = jobs.filter((j) => !failed.includes(j)).map((j) => j.label);
    console.error(`appshot: published ${done.length ? done.join(", ") : "nothing"}; NOT published: ${failed.map((j) => j.label).join(", ")}`);
    const retry = asVariants ? `appshot publish --variants ${shellQuote(positional[0])} --only ${failed.map((j) => j.key).join(",")}` : `appshot publish ${failed.map((j) => shellQuote(j.key)).join(" ")}`;
    console.error(`appshot: retry only the missing ones with: ${retry}`);
    process.exit(1);
  }
}
var [command, ...args] = process.argv.slice(2);
process.on("unhandledRejection", (err) => fail(err?.message || String(err)));
try {
  switch (command) {
    case "whoami":
      await whoami();
      break;
    case "upload":
      await upload(args);
      break;
    case "lint":
      lint(args);
      break;
    case "compose":
      compose(args);
      break;
    case "variants":
      variants(args);
      break;
    case "publish":
      await publish(args);
      break;
    default:
      console.error(
        "Usage: appshot <whoami | upload files\u2026 | lint plan.json\u2026 [--strict] | compose plan.json [--strict] |\n               variants plan.json [--out dir] [--force] [--strict] |\n               publish plan.json\u2026 [--strict] | publish --variants plan.json [--only A,B,C] [--strict]>"
      );
      process.exit(1);
  }
} catch (err) {
  fail(err?.message || String(err));
}
