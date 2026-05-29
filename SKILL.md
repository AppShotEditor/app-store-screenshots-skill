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

The model makes the creative calls (which benefit, the headline copy, device,
palette); the bundled CLI does the deterministic, mechanical work (upload, compose
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

### 3. Collect the screenshots
Ask the user for a folder of simulator/device screenshots (PNG/JPEG). Review them
and note what each shows, so you can pair it with the right benefit.

### 4. Upload
```
node <skill-dir>/dist/appshot.mjs upload path/to/shots/*.png
```
Prints `{ assets: [{ id, url, width, height, filename }] }`. Use each asset's `url`
and `width`/`height` in the plan.

### 5. Pair benefits ↔ screenshots → write plan.json
Choose 5–8 screens. For each: a `headline` (from a benefit), a `deviceId` matching
the screenshot's device, and a `background` (solid or gradient — keep one cohesive
palette). Write `plan.json` per `schema/plan.schema.json`:
```json
{
  "name": "<App name>",
  "screens": [
    {
      "headline": "Track every expense automatically",
      "background": { "type": "solid", "color": "#0f172a" },
      "deviceId": "iphone_16_pro",
      "screenshot": { "url": "<from upload manifest>", "width": 1179, "height": 2556 }
    }
  ]
}
```
Common `deviceId`s: `iphone_16_pro`, `iphone_16_pro_max`, `iphone_16`,
`pixel_9_pro`, `ipad_pro_13_m4`, `macbook_pro_14`. Match the screenshot's aspect ratio.

### 6. Publish the handoff
```
node <skill-dir>/dist/appshot.mjs publish plan.json
```
Prints the editor URL, e.g. `https://appshoteditor.com/app?import=<code>`.

### 7. Hand off
Give the user the URL. Signed in, they open it to fine-tune in the editor (move
layers, tweak copy, change backgrounds), then export at App Store resolutions.

## Notes
- `compose plan.json` prints the Template JSON without uploading — handy to preview/validate.
- Uploaded screenshots count against the user's storage quota (free tier: 25 MB).
- The handoff link is valid for 24 hours.
