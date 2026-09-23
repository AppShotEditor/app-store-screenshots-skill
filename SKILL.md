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
- the art direction on top: balanced line breaks, a hero screen, a tonal brand palette with ONE
  readable text colour (WCAG AA everywhere), magnified callouts, the app's mascot, soft shadows;
- linting the copy;
- writing three art directions;
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

### 2. Analyze the app → 5–10 benefits — for the BUYER
Read the app's source, README, and any store copy. Extract 5–10 concrete benefits — outcomes
("Track spending automatically"), not features ("uses SQLite"), and never a screen's own title
("Daily Puzzle", "Weekly Report Card"). Each becomes a screenshot headline.

**Write for whoever decides to download.** For kids', family, education and B2B apps the buyer is
not the user: a parent reads the listing, not the 8-year-old. Sell the parent's outcome
("Ace every spelling test", "See their progress every week"), not the game mechanic
("Spell through a story"). Screen 1 states the app's core PROMISE, not its first feature.

### 3. Style intake (short — then make the calls yourself)
Collect just enough to style the set, and don't run a questionnaire:
- **Brand colours.** Derive a BASE and an optional ACCENT from the app icon and UI: look at
  `Assets.xcassets/AppIcon.appiconset` (or `res/mipmap-*`, `public/`), `AccentColor.colorset`, the
  primary buttons in the screenshots. The base is the colour people associate with the app (a honey
  amber for a bee-themed app, not a rainbow); the accent is a second brand colour for badges. Then
  confirm in one line ("Using your honey #FFB61E + orange #F57C00 — OK?"). These go in
  `style.palette: { "mode": "tonal", "colors": [base, accent] }`.
- **Brand art (mascot).** Look for a character or brand mark in the app's assets
  (`*.xcassets/*.imageset`, `res/drawable*`, `public/`, `assets/`): e.g. `OnboardingBee.imageset`.
  Use the largest transparent PNG (`@3x`), look at it, note which way it faces, and confirm in one
  line ("I'll feature your bee mascot on the hero — OK?"). Upload it with the screenshots (step 6);
  it goes in `art`. No mascot? Skip it — never draw or generate one.
- **Brand font** (optional). Map it to the closest editor font: Inter (default), Arial, Helvetica,
  Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS, Impact or Comic Sans MS. Set it as
  `style.font`.
- **1–3 reference listings** they admire (optional). Take cues from them: frameless vs framed,
  colour intensity, how much copy.
- **Vibe.** Ask for one of *clean*, *playful* or *bold*. It decides which concept you recommend as
  the default (step 9): *clean* → B Clean Frameless, *playful* → C Story Panorama, *bold* →
  A Brand Classic.

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
  point), toasts, or status-bar clutter. Set the simulator's status bar BEFORE capturing (full
  battery, not charging, 9:41):
  `xcrun simctl status_bar <udid> override --time 9:41 --batteryState discharging --batteryLevel 100 --cellularBars 4 --wifiBars 3`
  (`xcrun simctl list devices booted` gives the udid). A charging bolt or a random time looks unfinished.

Example — the quality bar (a spelling app):

| # | App state to capture | Caption (headline) | Subheadline |
|---|---|---|---|
| 1 | Listen-and-type game, word half spelled, audio button mid-pulse | Ace every\nspelling test | Their weekly list, in minutes |
| 2 | "My Words" with this week's school list + "3 to review" badges | Their school list,\nready in seconds | — |
| 3 | Miss screen: the word spelled out letter by letter | Mistakes turn\ninto lessons | Every miss, spelled out |
| 4 | Weekly report card with a real grade and streak | See their progress\nevery week | — |

Avoid states that are empty or zero ("0 words", "0 day streak", "Level 1") — populate the app first.

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

**Mark a `callout` on the 3–5 selling screens.** A callout is the one element that proves the
benefit — the "3 to review" row, the P-L-A-Y tiles, the "B+" grade — shown magnified (1.6–2.2×) as a
rounded card over the device, so it reads even at search-result size (~110 px wide). Give it as a
crop `{ x, y, w, h }` (fractions of the image) tight around that element, **at most ~60% of the
image width** (wider can't be magnified) and never cutting through words. The card may sit over its
own source (the pop-out) but never hides more than 35% of the rest of the `focus` band: the
composer moves it up/down or out past the device edge, or shrinks it, and skips it
(`callout-skipped`) if nothing works — then mark a smaller callout or a tighter focus. Don't put
callouts on every screen; with `style.callouts: "auto"` the composer derives one only where the
`focus` band is tight (≤ 50% of the height), which is a blind guess — explicit crops look better.

### 6. Upload
```
node <skill-dir>/dist/appshot.mjs upload path/to/shots/*.png
```
Upload the mascot PNG in the same command (it's stored like a screenshot and counts against the
same quota). Prints `{ assets: [{ id, url, width, height, filename }] }`. Use each asset's `url`
and `width`/`height` in the plan (the mascot's goes in `art`). Re-running after a mid-batch failure is safe:
files already uploaded (same filename + size) are skipped, and a failed run still
prints a partial manifest (`"partial": true`) for the files that made it.

### 7. Write plan.json — copy rules first
One screen per shot-list entry (5–10), in story order. **Copy rules.** The composer lints these and
will not shrink text to rescue long copy:
- `headline`: **3–5 words, at most 2 lines**. It renders at ONE bold size for the whole set (~8.5%
  of the canvas width; the hero ≈1.25×). A long headline doesn't shrink; it makes the reserved text
  area taller on EVERY screen. Lead with the outcome ("Ace every spelling test"), not the feature
  ("Text-to-speech engine"). **Cut, don't shrink.**
- **Write the line break** with `\n` where the meaning splits: `"Mistakes turn\ninto lessons"`,
  never leaving one short word alone on a line. Your breaks are ALWAYS kept — the composer never
  merges lines you broke (so don't add a `\n` to copy that should be one line). Only a line that is
  itself too wide for the text box is broken further (balanced); that adds a line, which the lint
  flags. Without `\n` the composer balances the lines. A stranded last word is lint-warned
  (`headline-orphan`), and a single word too wide for the box is an error — shorten it.
- `subheadline` *(optional)*: **one line**, about 6–7 words at phone size. It adds one concrete
  detail. Omit it when the headline says it all; a set where most screens have no subheadline reads
  cleaner.
- `badge` *(optional)*: a 1–3 word pill above the headline. Use it on the hero (`style.hero.badge`)
  and at most one more screen, and only for a TRUE, checkable fact ("Grades 1–12", "No ads",
  "Works offline"). Never invent awards, ratings or endorsements ("Teacher-approved",
  "Editors' Choice") unless the user confirms them.

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
- `background`, or (recommended) omit it and set `style.palette`. With a palette or in a panorama the
  set gets ONE text colour that passes WCAG AA on every background — the composer adjusts the palette
  tones until it does. With an explicit background, set a contrasting `headlineColor` (a low-contrast
  one is lint-warned, `contrast-low`).
- `callout` *(selling screens)*: see step 5. `mascot` *(optional)*: `{ "art": "<art id>", "anchor":
  "headline" | "device-top" | "device-side" | "seam" }` — the hero gets the mascot via `style.hero`.

Plan-level `art` *(optional)*: `[{ "id": "bee", "url": "<upload url>", "width": 600, "height": 600,
"faces": "left" }]` — the mascot from step 3.

Plan-level `style` (all optional):
- `palette`: `{ "mode": "tonal", "colors": [base, accent], "tone": "vivid" }` (recommended) — each
  screen gets a light↔deep step of the brand hue. `tone`: `light` (pale, dark text), `vivid`
  (default), `deep`. Legacy: `family` (one shared gradient) / `sequence` (colours in turn) — avoid
  unrelated rainbow sequences; they don't belong to the brand.
- `hero`: on by default for screen 1 (bigger type, deeper bleed). Give it the promise, plus
  `{ "badge": "Grades 1–12", "mascot": { "art": "bee" } }`. `false` turns it off.
- `rhythm`: `{ "every": 4 }` — every 4th screen gets an accent layout so the set isn't one template.
- `callouts`: `"auto"` to derive callouts from tight focus bands (explicit `callout`s always apply).
- `font`: from the list in step 3.
- `presentation`: `device` (framed, default) | `frameless` | `zoom`.
- `bleed`: `auto` (default; lets the no-tangent rule decide) | `none` | `deep`.
- `tilt` + `tiltScreens`: 4–12° on at most 1–2 screens (the hero or a panorama), never the
  core-feature explainer.
- `panorama`: `{ "spans": [[0,1]], "straddle": [0], "decoration": "wave" }` for adjacent screens that
  share one continuous background. `decoration`: `orbs` | `honeycomb` | `wave` | `none` — pick one that
  fits the brand (concept C uses it even when you give no spans: `{ "decoration": "honeycomb" }`).
  `straddle` lists the span-start screens whose device crosses the seam; it only happens when ≥ 18%
  of the device can show on the next screen with the focus band kept back, else it's skipped.

The 3 concepts (step 8) decide presentation, layout, palette tone, hero, rhythm, tilt and panorama
for you. They keep your copy, badges, `focus` / `crop` / `callout`, `art`, the brand colours from
`palette` and the style's `font` / `bleed`. So a base plan usually needs `palette` (tonal, brand
colours), `hero` (badge + mascot), `art`, `panorama.decoration` and per-screen `focus` + `callout`.

**Omit `canvasWidth`/`canvasHeight`.** Each screen then gets its device's canvas and the editor
exports at the real App Store sizes; every layer is sized proportionally, so there's nothing to gain
by pinning native pixels. Only set them (both, single-device plans only) for a specific reason.

Write `plan.json` per `schema/plan.schema.json`:
```json
{
  "name": "<App name>",
  "art": [{ "id": "bee", "url": "<mascot url from upload manifest>", "width": 600, "height": 600, "faces": "left" }],
  "style": {
    "palette": { "mode": "tonal", "colors": ["#FFB61E", "#F57C00"] },
    "hero": { "badge": "Grades 1–12", "mascot": { "art": "bee" } },
    "panorama": { "decoration": "honeycomb" },
    "font": "Inter"
  },
  "screens": [
    {
      "headline": "Ace every\nspelling test",
      "subheadline": "Their weekly list, in minutes",
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.35, "bottom": 0.96 }
    },
    {
      "headline": "Their school list,\nready in seconds",
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.36, "bottom": 0.78 },
      "callout": { "x": 0.03, "y": 0.36, "w": 0.62, "h": 0.085 }
    },
    {
      "headline": "Mistakes turn\ninto lessons",
      "subheadline": "Every miss, spelled out",
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<from upload manifest>", "width": 1320, "height": 2868 },
      "focus": { "top": 0.46, "bottom": 0.94 },
      "callout": { "x": 0.2, "y": 0.5, "w": 0.6, "h": 0.18 }
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

- a headline over 5 words or more than 2 lines, or a single word stranded on its last line;
- a subheadline over 1 line;
- a text colour under WCAG AA on an explicit background (`contrast-low`);
- a callout crop too wide to magnify (`callout-skipped`) or no room for a mascot (`mascot-skipped`);
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
<https://unpkg.com/@appshoteditor/shot-dsl@0.5.0/src/device-frames.ts> (or locally at
`node_modules/@appshoteditor/shot-dsl/src/device-frames.ts` if you've run
`npm install` in the skill directory) — there's no CLI command that lists them.

### 8. Generate 3 art directions (default) and publish them
By default, don't publish one design. Publish three **distinct art directions** from the same copy
with one command:
```
node <skill-dir>/dist/appshot.mjs publish --variants plan.json
```
It prints one labelled link per concept, `A Brand Classic: https://…`, and so on, which means one handoff
and one editor project per concept.

If a concept fails, the others are still published. The CLI prints which ones were not published,
and the exact retry command, for example `publish --variants plan.json --only C`. Run only that.
Re-publishing a concept that already has a link doesn't break anything: a project is only created
when a link is opened. It just leaves an unused handoff link behind, and gives the user two links
for the same concept, so don't.

The concepts are:

- **A · Brand Classic**: device mockups on the vivid brand palette; the hero with the mascot and
  badge; callouts on the selling screens; every 4th screen flips to text-bottom for rhythm. The
  confident, on-brand default.
- **B · Clean Frameless**: pale brand tints and dark text; big full-width screenshots (no device)
  bleeding off the bottom, with callouts; the hero in large type with the mascot. Airy and modern.
  A zoom card only where you gave a `crop`.
- **C · Story Panorama**: the deeper brand tone as ONE continuous scene across triples and pairs of
  screens, a motif (`panorama.decoration`) flowing across the seams, the mascot flying across them,
  a tilted hero and deeper bleeds. The most eye-catching in the search-results strip.

Projects are named `<App> — A Brand Classic`, `<App> — B Clean Frameless` and
`<App> — C Story Panorama`. Publish one
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
  - one headline size (~8.5% of the width; hero ≈1.25×) in a text box 88% of the width, set in
    balanced lines;
  - one text colour per set, WCAG AA (≥ 4.5:1) on every palette background;
  - a text area sized for the tallest text block;
  - devices are at most 90% of the width and keep 5% side margins (only a panorama straddle crosses
    a side, at a seam, and only by ≥ 18% of the device);
  - callouts and mascots never cover the text; mascots avoid callouts and the focus band's core;
  - devices either clear the far edge by ≥ 4% of the height or bleed by ≥ 12% of their own height;
  - marked `focus` bands stay inside every edge and seam; a tilt is reduced if it can't keep that.
- Device shadows need the current editor (a newer deploy casts them from the screen); an older
  editor simply shows no device shadow. Everything else is accepted by any 0.4.0+ editor.
- `variants plan.json --out dir/` writes the three concept plans to inspect or edit them. It never
  overwrites its input, and needs `--force` to replace existing files. Publish the edited files with
  `publish dir/plan-A.json dir/plan-B.json dir/plan-C.json`.
- Uploaded screenshots count against the user's storage quota (free tier: 25 MB).
- The handoff link is valid for 24 hours.
