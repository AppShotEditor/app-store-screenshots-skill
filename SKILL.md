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

The model makes the creative calls: which benefits to sell, the story order, the copy, the style
and where each screenshot's selling UI (`focus`) is. The bundled CLI does the deterministic,
mechanical work:

- uploading the screenshots;
- composing valid layout DSL under a set-wide layout system: one device size, baseline and headline
  size, and no device "just touching" an edge;
- linting the copy;
- writing three design concepts;
- creating the handoffs.

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

### 3. Style intake (short — then make the calls yourself)
Collect just enough to style the set, and don't run a questionnaire:
- **Brand colours.** Derive them from the app icon: find it in `Assets.xcassets/AppIcon.appiconset`,
  `res/mipmap-*` or `public/`, look at it, and pick 1–3 hex colours. Then confirm them in one line
  ("Using your icon's orange #F77E1B + sky #6FC5FF — OK?").
- **Brand font** (optional). Map it to the closest editor font: Inter (default), Arial, Helvetica,
  Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS, Impact or Comic Sans MS. Set it as
  `style.font`.
- **1–3 reference listings** they admire (optional). Take cues from them: frameless vs framed,
  colour intensity, how much copy.
- **Vibe.** Ask for one of *clean*, *playful* or *bold*:
  - *clean*: one palette family, lots of air, frameless or framed straight;
  - *playful*: a colour sequence, a tilted hero, panorama;
  - *bold*: saturated colours, deep bleed, zoom cards.

After that you make the opinionated calls: palette, presentation, layouts and which screen is the
hero. Don't ask about each one.

### 4. Propose a shot list — BEFORE collecting screenshots
Great store screenshots are staged, not grabbed. Turn the strongest 5–10 benefits (the App Store allows up to 10 screenshots) into a
**shot list**: for each screen, the exact app **state** to capture plus its caption. Present it
to the user as a table and ask them to capture (or confirm) each shot.

**Story order — the first three sell.** Most visitors see only screens 1–3, in search results and
the first swipe. Put the strongest, most distinctive value props there:
1. the core promise or hero moment;
2. the main differentiator;
3. the payoff or result.

Use screens 4+ for supporting features, breadth (content, platforms) and trust (progress, reports,
social proof). Every screen must still work alone, because it may be the only one shown.

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
| 1 | Listen-and-type game, word half spelled, audio button mid-pulse | Hear the word. Spell it. | Every word read aloud |
| 2 | Perfect-score screen with confetti mid-burst, streak counter visible | A win they'll repeat. | — |
| 3 | Review list populated with 6–8 real missed words, one being retried | Fixes the words they miss. | Missed words come back |
| 4 | World map with 3 worlds unlocked, next one glowing | Spell through magical worlds. | — |

If the user already has screenshots, map them onto the shot list and **say explicitly which shots
are missing or weak** (e.g. "#3 is an empty review list — please add a few misses first, then
recapture"). Don't silently settle for a weaker state.

### 5. Collect + check the screenshots — and mark each one's `focus`
Ask for the folder of simulator/device captures (PNG/JPEG/WebP). **Look at every image** before
uploading and reject any that has:
- a **system dialog or sheet** — e.g. an iOS "Sign in to Apple Account" / "Allow notifications" /
  tracking-permission alert, a Game Center banner, a rating prompt;
- an **empty or loading state**, spinner, error, or placeholder data;
- visible debug overlays, a half-dismissed keyboard, or a cluttered status bar.

For each rejected image, name the problem and ask for a recapture of that shot.

For each accepted screenshot, note what it shows and **mark its `focus`**: the vertical band that
sells the benefit, as fractions of the image height (0 = top, 1 = bottom). Examples:

- the letter pad and word card: `{ "top": 0.35, "bottom": 0.8 }`;
- a chart in the upper half: `{ "top": 0.12, "bottom": 0.5 }`.

Leave out chrome that doesn't sell, such as tab bars and navigation titles. The composer keeps every
corner of a focus band inside all four canvas edges and any panorama seam. That holds on tilted
devices and zoom cards too: it reduces a bleed, shrinks the device or card slightly, or reduces the
tilt to keep it. If the selling
UI is a small detail (one card, one control), also give a `crop` `{ x, y, w, h }` (fractions) around
it; concept B turns that screen into a magnified zoom card. Judge `focus` from the image you looked
at, not from the shot list.

### 6. Upload
```
node <skill-dir>/dist/appshot.mjs upload path/to/shots/*.png
```
Prints `{ assets: [{ id, url, width, height, filename }] }`. Use each asset's `url`
and `width`/`height` in the plan. Re-running after a mid-batch failure is safe:
files already uploaded (same filename + size) are skipped, and a failed run still
prints a partial manifest (`"partial": true`) for the files that made it.

### 7. Write plan.json — copy rules first
One screen per shot-list entry (5–10), in story order. **Copy rules.** The composer lints these and
will not shrink text to rescue long copy:
- `headline`: **3–5 words, at most 2 lines**. It renders at ONE bold size for the whole set (~8.5%
  of the canvas width). A long headline doesn't shrink; it makes the reserved text area taller on
  EVERY screen. Lead with the outcome ("Hear the word. Spell it."), not the feature
  ("Text-to-speech engine"). **Cut, don't shrink.**
- `subheadline` *(optional)*: **one line**, about 6–7 words at phone size. It adds one concrete
  detail. Omit it when the headline says it all; a set where most screens have no subheadline reads
  cleaner.
- `badge` *(optional)*: a 1–3 word social-proof pill above the headline ("Teacher-approved",
  "Editors' Choice"). Use it on 1–2 screens, and only when it's true.

Per screen, also set:
- `deviceId` matching the screenshot's device.
- `screenshot` from the upload manifest.
- `focus`, and `crop` where one applies.
- `layout` *(optional)*:
  - `text-top` (default);
  - `text-bottom` (device above, text below);
  - `device-bleed` (a hero device placed lower).

  Screens that share a layout also share a device size and baseline. Only a plan you publish on its
  own keeps its layouts; the 3 concepts in step 8 set every screen to `text-top`.
- `background`, or omit it and set `style.palette`. With an explicit background, set a contrasting
  `headlineColor` (the default is white). With a palette or in a panorama, the colour is chosen
  automatically from what is actually behind the text; an explicit `headlineColor` still wins.

Plan-level `style` (all optional):
- `palette`: `{ "mode": "family" | "sequence", "colors": [hex…] }`. `family` gives every screen the
  same gradient (calm and unified). `sequence` walks through the colours screen by screen (playful).
- `font`: from the list in step 3.
- `presentation`: `device` (framed, default) | `frameless` | `zoom`.
- `bleed`: `auto` (default; lets the no-tangent rule decide) | `none` | `deep`.
- `tilt` + `tiltScreens`: 4–12° on at most 1–2 screens (the hero or a panorama), never the
  core-feature explainer.
- `panorama`: `{ "spans": [[0,1]], "straddle": [0] }` for adjacent screens that share one
  continuous background. `straddle` lists the span-start screens whose device crosses the seam
  (`true` means every span). Keep it to one per set; more is lint-warned.

The 3 concepts (step 8) decide presentation, layout, tilt and panorama for you. They keep your copy,
badges, colours, backgrounds, `focus` / `crop` and the style's `palette`, `font` and `bleed`. So a
base plan usually only needs `palette` / `font`.

**Omit `canvasWidth`/`canvasHeight`.** Each screen then gets its device's canvas and the editor
exports at the real App Store sizes; every layer is sized proportionally, so there's nothing to gain
by pinning native pixels. Only set them (both, single-device plans only) for a specific reason.

Write `plan.json` per `schema/plan.schema.json`:
```json
{
  "name": "<App name>",
  "style": {
    "palette": { "mode": "sequence", "colors": ["#F77E1B", "#2E6FD8", "#6C2BC4"] },
    "font": "Inter"
  },
  "screens": [
    {
      "headline": "Hear the word. Spell it.",
      "subheadline": "Every word read aloud",
      "badge": "Teacher-approved",
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.35, "bottom": 0.8 }
    },
    {
      "headline": "A win they'll repeat.",
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.2, "bottom": 0.62 },
      "crop": { "x": 0.08, "y": 0.2, "w": 0.84, "h": 0.3 }
    },
    {
      "headline": "Fixes the words they miss.",
      "background": { "type": "solid", "color": "#1E9E63" },
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.15, "bottom": 0.7 }
    }
  ]
}
```
Then lint it and fix what it flags by editing the copy:
```
node <skill-dir>/dist/appshot.mjs lint plan.json
```
The CLI validates the plan and prints every problem at once, such as an unknown field, a bad
`layout` or an unknown `deviceId`. Copy and composition issues are printed as warnings, for
example:

- a headline over 5 words or more than 2 lines;
- a subheadline over 1 line;
- more than 2 tilted screens;
- a panorama seam crossing a headline or focus band;
- a tilt reduced to keep the side margins.

`lint` runs the same checks as `publish` (plan, compose, template validation), so a plan that lints
clean publishes. Add `--strict` to make warnings fail the command. If the copy leaves the device less than
half the room it would get with no copy, composing fails with "copy too long for this canvas". Cut
the subheadline or headline. If it fails with "device … doesn't fit a W×H canvas", the canvas is the
problem, not the copy. Omit `canvasWidth`/`canvasHeight`, or pick a device that matches the
screenshot.

Common `deviceId`s: `iphone_17_pro`, `iphone_17_pro_max`, `iphone_air`,
`pixel_9_pro_xl`, `ipad_pro_13_m4`, `macbook_pro_14`. Match the screenshot's aspect
ratio. For the full current list (older iPhone sizes, more iPad/Mac variants,
`_menu_bar` laptop framings, desktops), read the `id` fields in the shot-dsl source:
<https://unpkg.com/@appshoteditor/shot-dsl@0.4.0/src/device-frames.ts> (or locally at
`node_modules/@appshoteditor/shot-dsl/src/device-frames.ts` if you've run
`npm install` in the skill directory) — there's no CLI command that lists them.

### 8. Generate 3 concepts (default) and publish them
By default, don't publish one design. Publish three **distinct concepts** from the same copy with
one command:
```
node <skill-dir>/dist/appshot.mjs publish --variants plan.json
```
It prints one labelled link per concept, `A Framed: https://…`, and so on, which means one handoff
and one editor project per concept.

If a concept fails, the others are still published. The CLI prints which ones were not published,
and the exact retry command, for example `publish --variants plan.json --only C`. Run only that.
Re-publishing a concept that already has a link doesn't break anything: a project is only created
when a link is opened. It just leaves an unused handoff link behind, and gives the user two links
for the same concept, so don't.

The concepts are:

- **A · Framed**: device mockups, straight, one consistent layout, and the no-tangent bleed rule.
  The safe, classic look.
- **B · Frameless**: rounded screenshots with soft shadows, which is the modern default. Screens
  with a `crop` (or a tight `focus` band) become magnified zoom cards of their selling UI.
- **C · Panorama**: pairs of screens share one continuous background with seam decoration. Only the
  tilted hero's device straddles its seam, so there is one crossing per set; the other devices stay
  centred and straight. It is eye-catching in the search-results strip.

Projects are named `<App> — A Framed`, `<App> — B Frameless` and `<App> — C Panorama`. Publish one
plan (`publish plan.json`) only when the user asks for a single design.

### 9. Hand off — as Product Page Optimization candidates
Give the user all three links with one line each on what the concept bets on. Frame them as
**App Store Product Page Optimization** test candidates (Google Play: store listing experiments):

1. pick a default;
2. run the other one or two as treatments against it for a couple of weeks;
3. keep the winner.

Signed in, they open each link to fine-tune in the editor (move layers, tweak copy, change
backgrounds), then export at App Store resolutions. Panorama halves are independent layers in the
editor, so moving a straddling device on one screen doesn't move its continuation.

## Notes
- `compose plan.json` prints the Template JSON without uploading, which is handy for previewing or
  validating.
- Set rules the composer enforces:
  - one device scale and baseline per group of screens that share a device, layout, presentation
    and tilt;
  - one headline size (~8.5% of the width) with 8% side padding;
  - a text area sized for the tallest text block;
  - devices are at most 90% of the width and keep 5% side margins (only a panorama straddle crosses
    a side, at a seam);
  - devices either clear the far edge by ≥ 4% of the height or bleed by ≥ 12% of their own height;
  - marked `focus` bands stay inside every edge and seam; a tilt is reduced if it can't keep that.
- `variants plan.json --out dir/` writes the three concept plans to inspect or edit them. It never
  overwrites its input, and needs `--force` to replace existing files. Publish the edited files with
  `publish dir/plan-A.json dir/plan-B.json dir/plan-C.json`.
- Uploaded screenshots count against the user's storage quota (free tier: 25 MB).
- The handoff link is valid for 24 hours.
