# App Store Screenshots — Agent Skill

Generate **editable** App Store / Play Store screenshots from your app's codebase and your
simulator screenshots. Instead of baking flat PNGs, this skill composes a device-framed layout
and returns an editable link you open in **[appshoteditor.com](https://appshoteditor.com)** to
fine-tune, then export at the exact sizes Apple and Google require.

This is an [Agent Skill](https://docsalot.dev/blog/skill-md) (the open `SKILL.md` standard), so it
works across compatible coding agents — **Claude Code, OpenAI Codex CLI, Cursor,
opencode**, and others. The instructions load in any of them; the actual work is a self-contained
Node CLI, so it runs anywhere there's a shell + Node.

## What it does

1. Analyzes your app (source / README / store copy) → 5–10 benefit-driven headlines, then proposes
   a **shot list** — the exact app state to capture for each screen — and checks your captures for
   empty states and system dialogs before using them.
2. Uploads your screenshots (PNG/JPEG/WebP) to your appshoteditor.com account (metered;
   25 MB free tier).
3. Composes the layouts deterministically as one **set-wide system**:
   - one device size, one baseline and one headline size;
   - no device "just touching" the bottom or a side edge: devices are at most 90% of the width;
   - the selling UI (`focus`) stays inside every edge and panorama seam, including on tilted
     devices.

   On top of that system it art-directs (shot-dsl 0.5.0): balanced line breaks, a hero screen, a
   tonal brand palette with ONE text colour that passes WCAG AA everywhere, magnified callouts of
   the selling element, the app's mascot, and soft shadows. It lints the copy against pro rules.
4. Writes **three distinct art directions** (A Brand Classic, B Clean Frameless, C Story Panorama) and
   returns one editor link per concept, as Product Page Optimization test candidates. You fine-tune
   layers, copy and backgrounds in the editor, then export.

## Prerequisites

- **Node 22+** — the bundled CLI (`dist/appshot.mjs`) is self-contained, no install needed.
- An **API token** — sign in at <https://appshoteditor.com/account>, generate a token, then:
  ```bash
  export APPSHOTEDITOR_TOKEN=ase_…
  ```

## Install

Clone into your agent's skills directory (use the folder name `appshot-screenshots` to match the
skill's registered name):

| Tool          | Skills path                                  |
| ------------- | -------------------------------------------- |
| Claude Code   | `~/.claude/skills/appshot-screenshots`       |
| OpenAI Codex  | `~/.codex/skills/appshot-screenshots`        |
| Cursor        | `~/.cursor/skills/appshot-screenshots`       |
| opencode      | `~/.config/opencode/skills/appshot-screenshots` |

```bash
git clone https://github.com/AppShotEditor/app-store-screenshots-skill.git \
  ~/.claude/skills/appshot-screenshots
```

Set `APPSHOTEDITOR_TOKEN`, then ask your agent to "make App Store screenshots for this app." It will
follow `SKILL.md`: analyze → upload your screenshots → compose → hand you an editor link.

## Contents

- `SKILL.md` — the orchestration the agent reads.
- `src/cli.ts` — CLI source (`whoami`, `upload`, `lint`, `compose`, `variants`, `publish`).
- `scripts/build.mjs` — esbuild config that produces the bundle.
- `dist/appshot.mjs` — self-contained Node bundle (committed; what end users run).
- `schema/plan.schema.json` — the compose-plan format (see below).

## Plan format

`compose` / `publish` take a `plan.json` (JSON Schema: `schema/plan.schema.json`):

```json
{
  "name": "My App",
  "screens": [
    {
      "headline": "Hear the word. Spell it.",
      "subheadline": "Words read aloud, answers checked instantly",
      "layout": "text-top",
      "headlineColor": "#ffffff",
      "background": { "type": "solid", "color": "#2E6FD8" },
      "deviceId": "iphone_17_pro_max",
      "screenshot": { "url": "<asset url from upload>", "width": 1320, "height": 2868 }
    }
  ]
}
```

| Screen field | Required | Notes |
| --- | --- | --- |
| `headline` | yes | 3–5 words, benefit-led, 2 lines max. Rendered bold at ~8.5% of canvas width (hero ≈1.25×, never adding a line), never shrunk. Write the break with `\n` — it is always kept; only a line too wide for the box is broken further. Otherwise lines are balanced (no stranded last word). A single word wider than the box is an error. |
| `subheadline` | no | One short supporting line, ~50% of the headline size, weight 600, full contrast (the text colour tinted toward the brand hue). |
| `headlineColor` / `subheadlineColor` | no | Hex; an explicit value always wins. If omitted, the set gets ONE text colour, chosen against every screen's background: palette tones are adjusted until it passes WCAG AA; explicit backgrounds are never recoloured, and a screen (or a panorama span, as one unit) whose explicit background can't reach AA with the set colour gets its own readable colour. An explicit-only set keeps white when white works. |
| `layout` | no | `text-top` (default; device below: it clears the bottom by ≥ 4% or bleeds ≥ 12% of its height, never "just touching"), `text-bottom` (the same, mirrored: device on top, text below), `device-bleed` (a hero device pushed lower, bleeding more). Devices are at most 90% of the width. |
| `deviceId` | yes | Device frame id, e.g. `iphone_17_pro_max`, `pixel_9_pro_xl`, `ipad_pro_13_m4`, `macbook_pro_14`. |
| `screenshot` | yes | `{ url, width, height }` from the upload manifest. |
| `background` | yes, unless `style.palette` is set | `{ type: "solid", color }` or `{ type: "gradient", gradient: { type, colorStops } }`. |
| `focus` | no | `{ top, bottom }`: the selling UI as fractions of the screenshot height. Its corners always stay ≥ 2% inside every canvas edge and panorama seam, tilted devices included; a bleed or tilt is reduced to keep it. A zoom card too small for a band warns `zoom-focus-cropped`. |
| `crop` | no | `{ x, y, w, h }` fractions: the zoom window (defaults to the focus band). |
| `presentation` | no | Per-screen override of `style.presentation`. |
| `tilt` | no | Per-screen tilt in degrees (clockwise). |
| `badge` | no | Short pill above the headline (1–3 words) — only true, checkable facts. |
| `callout` | no | `{ x, y, w, h }` fractions (≤ ~60% wide): the selling element, shown 1.6–2.2× larger as a rounded card over the device, never over the text, hiding at most 35% of the rest of the `focus` band (moved, shrunk or skipped otherwise). `false` opts out of an auto callout. |
| `mascot` | no | `{ art, anchor?: headline \| device-top \| device-side \| seam, size?, flip? }` — brand art from plan `art`, placed clear of text, callouts and the focus band. |

Plan-level `art` (optional): `[{ id, url, width, height, faces? }]` — mascot PNGs uploaded like screenshots.

Plan-level `style` (all optional). **0.5.0 defaults apply without a `style`:** screen 1 is the
hero (1.25× headline, `deep` bleed, its own device pose) and devices get soft shadows —
`style.hero: false` / `style.shadows: false` restore the 0.4.0 look. Old plans still compose, but
their lines may break differently (balanced) and the new lint warnings (`headline-orphan`,
`contrast-low`, `callout-skipped`, `mascot-skipped`, `handoff-size`) can make `--strict` fail for a
plan that passed under 0.4.0:

| Style field | Notes |
| --- | --- |
| `presentation` | `device` (default, framed) · `frameless` (rounded screenshot + shadow) · `zoom` (magnified crop of `crop` / the focus band). |
| `bleed` | `auto` (default; the no-tangent rule: a device that clears by ≥ 4% of H stays; one that would touch the edge bleeds ≥ 12% of its height instead, and clears only when every such bleed would crop its focus band) · `none` · `deep` (the device grows toward a 25% bleed; once it hits the 90%-width cap it bleeds ≥ 12% instead of leaving a gap under the text). |
| `tilt` + `tiltScreens` | Degrees applied only to the listed screen indices. Use it as an accent on at most 1–2 screens. A tilted device prefers a bleed under `auto` / `deep`. If a tilted device, frameless screenshot or zoom card can't keep its 5% side margins (and its focus band inside), it is shrunk by at most 20%, keeping a zoom card's aspect. After that the tilt is reduced, with a `tilt-reduced` warning. |
| `palette` | `{ mode: "tonal", colors: [base, accent?], tone?: "light" \| "vivid" \| "deep" }` (recommended: light↔deep steps of the brand hue) or legacy `family` / `sequence`. Backgrounds for screens that omit one, with ONE WCAG-AA text colour per set. |
| `panorama` | `{ spans?: [[0,1], …], straddle?, decoration?: "orbs" \| "honeycomb" \| "wave" \| "none" }`. Adjacent screens share one continuous background (a tonal palette: one ramp through the span); `honeycomb` / `wave` draw one motif across every seam. `straddle` is `true` (every span) or a list of span-start indices; a device only crosses when ≥ 18% of it can show on the next screen. |
| `hero` | Default ON for screen 1: `{ screen?, scale?, layout?, bleed? (deep), tilt?, badge?, mascot? }` — bigger type, deeper bleed, optional badge + mascot. `false` turns it off. |
| `rhythm` | `{ every: 3–6, treatment?: "text-bottom" \| "callout" }` — an accent screen every N so the set isn't one template. |
| `callouts` | `"auto"`: derive a callout from a tight `focus` band (≤ 50% tall) where no explicit one is given. |
| `shadows` | Default `true`: soft brand-tinted shadows on devices, frameless shots, callouts and mascots. |
| `font` | One of the editor's fonts (Inter default, Arial, Helvetica, Georgia, Times New Roman, Courier New, Verdana, Trebuchet MS, Impact, Comic Sans MS). Line wraps are estimated with per-font metrics, so wide faces reserve more room. |

**Set rules.** Text is never shrunk per screen. Every screen shares one headline size, and the text
area is reserved for the tallest text block in the set. Screens that share a device, layout,
presentation and tilt share one device scale and baseline. Copy that breaks the rules gets a
warning, not a smaller font:

- a headline over 5 words, more than 2 lines, or a stranded last word;
- a subheadline over 1 line;
- low contrast on an explicit background, a callout too wide to magnify, no room for a mascot.

If the copy is so long that it leaves the device less than half the size it would get with no copy,
composing fails with "copy too long for this canvas … cut the subheadline or headline". If a device
can't reach a usable size on the canvas even with no copy, the error says the canvas is the problem
instead ("doesn't fit a W×H canvas … use the device's own canvas").

**Art directions (`variants` / `publish --variants`).**
- **A Brand Classic**: device frames, vivid tonal palette, hero with mascot + badge, callouts,
  every 4th screen text-bottom.
- **B Clean Frameless**: light tonal palette + dark text, big full-width frameless screenshots
  bleeding deep, callouts, large-type hero with the mascot (a zoom card only for an explicit `crop`).
- **C Story Panorama**: deep tonal palette as one scene across triples/pairs, a motif across the
  seams, the mascot crossing seams, a tilted hero (your `style.tilt`, or 8°), deep bleeds.
- **Kept** from your plan: copy, badges, colours, `background`, `deviceId`, `screenshot`, `focus`,
  `crop`, `callout`, `mascot`, `art`, canvas size, the brand colours of `palette`, `font` and
  `bleed: none`.
- **Overridden:** every `layout` becomes `text-top` (the hero and rhythm accents differ on purpose);
  per-screen `presentation` / `tilt` are dropped; the palette becomes `tonal` with the concept's
  tone; hero, rhythm, callouts and panorama are set per concept (C keeps your `panorama.spans` /
  `decoration` / `straddle` when given).

**Panorama backgrounds.** The span's first screen's background runs across the whole span:
- a solid colour stays solid;
- a linear gradient keeps its colour stops and `angle`; without an `angle`, it runs corner to
  corner across the span;
- a radial gradient or explicit `coords` can't span screens and is rejected with a clear error.

Seam orbs are moved or shrunk so they never overlap either screen's text block, and dropped when
there's no room.

**Panorama in the editor.** The editor shows each screen separately. The two halves of a panorama
(background, orbs, and the straddling device plus its "(continued)" copy) are independent layers on
each screen, so moving one doesn't move the other. Re-run `variants` / `publish` rather than
realigning by hand.

Plan-level `canvasWidth` / `canvasHeight` are optional and **best omitted**: each screen then gets its
device's canvas and the editor exports at App Store sizes. All geometry (device size, font sizes,
padding) is proportional to the canvas, so pinning native pixels (e.g. 1320×2868) produces the same
layout. If you do set them, set both, and only in a single-device plan. The CLI validates plans and
reports every problem at once.

## CLI (used by the skill)

```bash
# point at a local dev server instead of production:
export APPSHOTEDITOR_URL=http://localhost:5173

node dist/appshot.mjs whoami                  # verify token works; prints plan + storage (run first)
node dist/appshot.mjs upload shots/*.png      # → { assets: [{ id, url, width, height, filename }] }
node dist/appshot.mjs lint plan.json          # the same checks as publish, no network; warnings + validity
node dist/appshot.mjs compose plan.json       # prints the layout Template JSON (no upload)
node dist/appshot.mjs publish plan.json       # → https://appshoteditor.com/app?import=<code>
node dist/appshot.mjs publish --variants plan.json         # → one link per concept (A Brand Classic, B Clean Frameless, C Story Panorama)
node dist/appshot.mjs publish --variants plan.json --only C # retry / publish just some concepts
node dist/appshot.mjs variants plan.json --out dir/        # optional: write plan-A/B/C.json to inspect or edit
node dist/appshot.mjs publish dir/plan-A.json dir/plan-B.json   # → one link per plan
```

`lint`, `compose`, `variants` and `publish` print warnings to stderr; `--strict` makes any warning
fatal. `lint` exits non-zero on an invalid plan or template. `variants` never overwrites its own
input and refuses to replace existing `plan-*.json` files without `--force`.

Publishing several plans composes and validates all of them before the first upload. Each handoff
then succeeds or fails on its own, labelled. Transient failures are retried with backoff: network
errors, 429, 5xx, and requests with no response within 30 s (`APPSHOTEDITOR_TIMEOUT_MS` overrides
the timeout). A summary names what was published and prints the exact command that retries
only the missing concepts (`--only B,C`) or plan files.

Uploads are resumable: files already stored (same filename + size) are skipped, and if a batch
fails partway the CLI prints a partial manifest (`"partial": true`) — just re-run the same command.

`whoami` requires a token; without one (or with an invalid one) it prints account-creation steps
and exits non-zero — so a brand-new user is told to create a free account before anything runs.

Handoff links are valid for 24 hours.

## Development

```bash
npm install   # fetches @appshoteditor/shot-dsl + esbuild
npm run build # bundles src/cli.ts (+ DSL) → dist/appshot.mjs
```

The layout DSL + device geometry come from
[`@appshoteditor/shot-dsl`](https://www.npmjs.com/package/@appshoteditor/shot-dsl) on npm — the same
package the editor uses, so a layout composed here renders identically there. Bump the dep + rebuild
whenever the DSL changes. The DSL `schemaVersion` is the compatibility contract.

To bundle an **unpublished** local checkout of the DSL instead of the npm copy (package.json is left
alone), point `SHOT_DSL_PATH` at the package directory:

```bash
SHOT_DSL_PATH=../app-shot-editor/packages/shot-dsl npm run build
```

The bundle's second line records which DSL version (and whether local source) it was built from.
Set `OUT=<file>` to write the bundle somewhere other than `dist/appshot.mjs`, for example a scratch
file while testing an unreleased DSL.
