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

1. Analyzes your app (source / README / store copy) → 5–10 benefit-driven headlines.
2. Uploads your screenshots (PNG/JPEG/WebP) to your appshoteditor.com account (metered;
   25 MB free tier).
3. Composes device-framed layouts deterministically (the bundled CLI does the mechanical work).
4. Returns an editor link to fine-tune layers, copy, and backgrounds, then export.

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
- `src/cli.ts` — CLI source (`whoami`, `upload`, `compose`, `publish`).
- `scripts/build.mjs` — esbuild config that produces the bundle.
- `dist/appshot.mjs` — self-contained Node bundle (committed; what end users run).
- `schema/plan.schema.json` — the compose-plan format.

## CLI (used by the skill)

```bash
# point at a local dev server instead of production:
export APPSHOTEDITOR_URL=http://localhost:5173

node dist/appshot.mjs whoami                  # verify token works; prints plan + storage (run first)
node dist/appshot.mjs upload shots/*.png      # → { assets: [{ id, url, width, height, filename }] }
node dist/appshot.mjs compose plan.json       # prints the layout Template JSON (no upload)
node dist/appshot.mjs publish plan.json       # → https://appshoteditor.com/app?import=<code>
```

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
