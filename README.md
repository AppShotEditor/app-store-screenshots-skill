# App Store Screenshots — Agent Skill

Generate **editable** App Store / Play Store screenshots from your app's codebase and your
simulator screenshots. Instead of baking flat PNGs, this skill composes a device-framed layout
and returns an editable link you open in **[appshoteditor.com](https://appshoteditor.com)** to
fine-tune, then export at the exact sizes Apple and Google require.

This is an [Agent Skill](https://docsalot.dev/blog/skill-md) (the open `SKILL.md` standard), so it
works across compatible coding agents — **Claude Code, OpenAI Codex CLI, Gemini CLI, Cursor,
opencode**, and others. The instructions load in any of them; the actual work is a self-contained
Node CLI, so it runs anywhere there's a shell + Node.

## What it does

1. Analyzes your app (source / README / store copy) → 5–10 benefit-driven headlines.
2. Uploads your screenshots to your appshoteditor.com account (metered; 25 MB free tier).
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
git clone git@github.com:AppShotEditor/app-store-screenshots-skill.git \
  ~/.claude/skills/appshot-screenshots
```

Set `APPSHOTEDITOR_TOKEN`, then ask your agent to "make App Store screenshots for this app." It will
follow `SKILL.md`: analyze → upload your screenshots → compose → hand you an editor link.

## Contents

- `SKILL.md` — the orchestration the agent reads.
- `dist/appshot.mjs` — self-contained CLI: `upload`, `compose`, `publish`.
- `schema/plan.schema.json` — the compose-plan format.

## CLI (used by the skill)

```bash
# point at a local dev server instead of production:
export APPSHOTEDITOR_URL=http://localhost:5173

node dist/appshot.mjs upload shots/*.png      # → { assets: [{ id, url, width, height }] }
node dist/appshot.mjs compose plan.json       # prints the layout Template JSON (no upload)
node dist/appshot.mjs publish plan.json        # → https://appshoteditor.com/app?import=<code>
```

Handoff links are valid for 24 hours.

## Development

Source and build live in the main app repo (`AppShotEditor/app-shot-editor`, under
`skill/appshot-screenshots/`). The CLI shares the editor's layout DSL (`src/lib/shot-dsl/`) and device
geometry; `npm run build:skill` bundles them into `dist/appshot.mjs`. The DSL `schemaVersion` is the
compatibility contract — when it changes, rebuild and re-publish the bundle here.
