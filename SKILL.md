---
name: appshot-screenshots
description: >-
  Generate EDITABLE App Store / Play Store screenshots from an app's codebase plus
  the user's simulator screenshots, then hand off an editable layout to
  appshoteditor.com (not flattened PNGs). Use when the user wants marketing
  screenshots they can fine-tune in a browser editor. The skill analyzes the app
  for benefits, uploads the user's screenshots to their account, composes
  device-framed layouts deterministically, and returns an editor link.
---

# App Shot Editor — editable App Store screenshots

Produce App Store screenshots as an **editable layout** the user opens in
appshoteditor.com — analyze the app → extract benefits → pair them with the user's
screenshots → compose device-framed layouts → hand off a link to fine-tune.

The model makes the creative calls (which benefit, the shot list, the headline copy,
device, palette, layout); the bundled CLI does the deterministic, mechanical work (upload, compose
valid layout DSL, create the handoff).

## Prerequisites

- **A free appshoteditor.com account + an API token.** This is required before anything else.
  If the user doesn't have an account yet, tell them:
  1. Open https://appshoteditor.com/account and **sign in with Google** — this creates the account.
  2. Generate an API token on that page.
  3. `export APPSHOTEDITOR_TOKEN=ase_…`
  Don't continue without it.
- Node 22+. The CLI at `dist/appshot.mjs` (this skill's directory) is self-contained.
- Local dev: set `APPSHOTEDITOR_URL=http://localhost:5173` to target a local server.

## Workflow

### 1. Verify the account/token FIRST — before any other work
Run the pre-flight check before reading the codebase or touching screenshots:
```
node <skill-dir>/dist/appshot.mjs whoami
```
- **Success** prints the plan + storage used → continue.
- **Failure** (no token, or `401`) means the user has no account or an invalid token. **STOP** and
  walk them through creating a free account + token (see Prerequisites). Do not proceed — the later
  steps will only fail at upload time after wasted effort.

### 2. Analyze the app → 5–10 benefits
Read the app's source, README, and any store copy. Extract 5–10 concrete,
user-facing benefits — outcomes ("Track spending automatically"), not features
("uses SQLite"). Each becomes a screenshot headline.

### 3. Propose a shot list — BEFORE collecting screenshots
Great store screenshots are staged, not grabbed. Turn the strongest 5–10 benefits (the App Store allows up to 10 screenshots) into a
**shot list**: for each screen, the exact app **state** to capture plus its caption. Present it
to the user as a table and ask them to capture (or confirm) each shot.

Each shot must specify a state that *shows the benefit happening*:
- **Mid-interaction**, not a resting menu — a word half-typed, a timer running, a chart being
  scrubbed, a success moment.
- **Populated with realistic data** — real-looking names, numbers, progress. **No empty states**,
  no "No items yet", no placeholder/lorem text, no debug UI.
- **Clean chrome** — no system alerts, permission prompts, keyboards (unless typing *is* the
  point), toasts, or status-bar clutter (use the simulator's clean status bar:
  `xcrun simctl status_bar booted override --time 9:41 --batteryLevel 100 --cellularBars 4`).

Example — the quality bar (a spelling app):

| # | App state to capture | Caption (headline) | Subheadline |
|---|---|---|---|
| 1 | Listen-and-type game, word half spelled, audio button mid-pulse | Hear the word. Spell it. | Words read aloud, answers checked instantly |
| 2 | Perfect-score screen with confetti mid-burst, streak counter visible | A win they'll want to repeat. | — |
| 3 | Review list populated with 6–8 real missed words, one being retried | Fixes the words they miss. | Mistakes come back until they stick |
| 4 | World map with 3 worlds unlocked, next one glowing | Spell through magical worlds. | — |

If the user already has screenshots, map them onto the shot list and **say explicitly which shots
are missing or weak** (e.g. "#3 is an empty review list — please add a few misses first, then
recapture"). Don't silently settle for a weaker state.

### 4. Collect + check the screenshots
Ask for the folder of simulator/device captures (PNG/JPEG/WebP). **Look at every image** before
uploading and reject any that has:
- a **system dialog or sheet** — e.g. an iOS "Sign in to Apple Account" / "Allow notifications" /
  tracking-permission alert, a Game Center banner, a rating prompt;
- an **empty or loading state**, spinner, error, or placeholder data;
- visible debug overlays, a half-dismissed keyboard, or a cluttered status bar.

For each rejected image, name the problem and ask for a recapture of that shot. Note what each
accepted screenshot shows so you can pair it with its shot-list caption.

### 5. Upload
```
node <skill-dir>/dist/appshot.mjs upload path/to/shots/*.png
```
Prints `{ assets: [{ id, url, width, height, filename }] }`. Use each asset's `url`
and `width`/`height` in the plan. Re-running after a mid-batch failure is safe:
files already uploaded (same filename + size) are skipped, and a failed run still
prints a partial manifest (`"partial": true`) for the files that made it.

### 6. Pair shots ↔ screenshots → write plan.json
One screen per shot-list entry (5–10). For each:
- `headline` — the caption. **Short (≈2–6 words), benefit-led, 2 lines max.** It renders
  large and bold (~8.5% of the canvas width); longer copy gets auto-shrunk and reads worse. Lead
  with the outcome ("Hear the word. Spell it."), not the feature ("Text-to-speech engine").
- `subheadline` *(optional)* — one short supporting line (≲8 words), rendered smaller (~55% of
  the headline) and slightly muted. Use it to add a concrete detail; omit it when the headline
  says it all. `subheadlineColor` defaults to the headline color.
- `layout` *(optional)* — `text-top` (default: text above, device below bleeding off the
  bottom), `text-bottom` (device at the top bleeding off the top edge, text below), or
  `device-bleed` (text on top, oversized ~95%-width device bleeding heavily off the bottom — a
  hero look for the first or most visual screen). Mostly `text-top`; vary deliberately.
- `deviceId` matching the screenshot's device, and a `background` (solid or gradient — keep one
  cohesive palette across the set; `headlineColor` must contrast with it).
- **Omit `canvasWidth`/`canvasHeight`.** Each screen then gets its device's canvas and the editor
  exports at the real App Store sizes; every layer is sized proportionally, so there's nothing to
  gain by pinning native pixels. Only set them (both, single-device plans only) for a specific
  reason.

Write `plan.json` per `schema/plan.schema.json`:
```json
{
  "name": "<App name>",
  "screens": [
    {
      "headline": "Hear the word. Spell it.",
      "subheadline": "Words read aloud, answers checked instantly",
      "layout": "device-bleed",
      "headlineColor": "#ffffff",
      "background": {
        "type": "gradient",
        "gradient": {
          "type": "linear",
          "colorStops": [
            { "offset": 0, "color": "#6FC5FF" },
            { "offset": 1, "color": "#2E6FD8" }
          ]
        }
      },
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 }
    },
    {
      "headline": "A win they'll want to repeat.",
      "background": { "type": "solid", "color": "#1E9E63" },
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 }
    }
  ]
}
```
The CLI validates the plan (unknown fields, bad `layout`, unknown `deviceId`, …) and prints every
problem at once — fix them and re-run.
Common `deviceId`s: `iphone_17_pro`, `iphone_17_pro_max`, `iphone_air`,
`pixel_9_pro_xl`, `ipad_pro_13_m4`, `macbook_pro_14`. Match the screenshot's aspect
ratio. For the full current list (older iPhone sizes, more iPad/Mac variants,
`_menu_bar` laptop framings, desktops), read the `id` fields in the shot-dsl source:
<https://unpkg.com/@appshoteditor/shot-dsl@0.3.0/src/device-frames.ts> (or locally at
`node_modules/@appshoteditor/shot-dsl/src/device-frames.ts` if you've run
`npm install` in the skill directory) — there's no CLI command that lists them.

### 7. Publish the handoff
```
node <skill-dir>/dist/appshot.mjs publish plan.json
```
Prints the editor URL, e.g. `https://appshoteditor.com/app?import=<code>`.

### 8. Hand off
Give the user the URL. Signed in, they open it to fine-tune in the editor (move
layers, tweak copy, change backgrounds), then export at App Store resolutions.

## Notes
- `compose plan.json` prints the Template JSON without uploading — handy to preview/validate.
- The composer derives all geometry from the canvas: device ≈86% of the width (95% for
  `device-bleed`), headline ≈8.5% of the width (7.2% if it would need 3+ lines), 8% side padding.
- Uploaded screenshots count against the user's storage quota (free tier: 25 MB).
- The handoff link is valid for 24 hours.
