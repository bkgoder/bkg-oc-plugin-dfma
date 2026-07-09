# BKG OpenCode Plugin DFMA

BKG OpenCode Plugin DFMA is a plugin-ready OpenCode package for coordinated agent work. It bundles the BKG six-command workflow assets, background delegation, Agent Rat voting, dashboard review gates, local memory, sync manifests, update-notifier parsing, Conclave-style debate sessions, Fourth Voice external reviewer API, and a stable BitShit adapter surface.

The package is intentionally local-first. It writes runtime state under the user account, exposes browser-based control surfaces, and keeps user approval explicit instead of letting agents quietly decide important things because apparently civilization needed another way to create paperwork.

## Package

```json
{
  "plugin": ["bkg-oc-plugin-bkg-dfma@0.1.0"]
}
```

For local development, install from this repository or use the generated package tarball after `npm pack`.

## Auto-install

When installed via `npm install`, the plugin automatically:

1. Copies OpenCode assets (commands, agents, skills, rules) to `~/.config/opencode`
2. Updates `opencode.json` with the plugin reference
3. Registers all BKG agents and skills
4. Installs CLI helper scripts (`0ero`, `1brain`, `2hit`, `3some`, `4ever`, `4ucker`)
5. Sets up bash permissions for BKG commands

For manual installation:

```bash
npm run install:assets
```

## Docs

- Implementation plan: [`docs/plugin-ready-plan.md`](docs/plugin-ready-plan.md)
- Task backlog: [`docs/tasks.md`](docs/tasks.md)
- Agent work contract: [`docs/agent-work-contract.md`](docs/agent-work-contract.md)
- Agent lane prompts: [`docs/agent-lane-prompts.md`](docs/agent-lane-prompts.md)
- Release readiness gate: [`docs/release-readiness.md`](docs/release-readiness.md)
- ACP compatibility: [`docs/acp.md`](docs/acp.md)
- Debate reports: [`docs/debat/`](docs/debat/)

## ACP editors

OpenCode already speaks ACP. Start it as the editor-managed subprocess with:

```bash
opencode acp
```

The plugin continues to work through OpenCode's normal tools, commands, agents,
rules, permissions, MCP servers, formatters, and linters. It does not implement
its own JSON-RPC transport.

Zed:

```json
{
  "agent_servers": {
    "OpenCode": {
      "command": "opencode",
      "args": ["acp"]
    }
  }
}
```

JetBrains uses the same shape but should set `command` to the absolute path of
the OpenCode binary. For Avante.nvim and CodeCompanion examples, remote
dashboard/review-gate settings, and ACP limitations, see
[`docs/acp.md`](docs/acp.md). OpenCode currently does not support `/undo` and
`/redo` in ACP mode.

## Core features

- **Background agents**: delegate work and store delegation artifacts.
- **Live subagent output**: stream nested agent sessions, tools, reasoning and results into the dashboard.
- **Agent Rat**: escalate blockers into structured multi-agent review.
- **Vote engine**: record approve, reject, abstain and tally decisions.
- **Dashboard**: local HTTP UI for blockers, Rat sessions, votes, memory, TTS and fourth-voice requests.
- **Review gate**: Plannotator-inspired local browser approval flow supports approve, reject, revise, and annotations for blocker and Rat decisions.
- **Conclave model**: Captain plus Facts, Logic and Alternative perspectives with consensus threshold support.
- **Sync manifest**: OpenCode config, skills, agents, model favorites and BKG plugin state path planning inspired by opencode-synced.
- **Update notifier parser**: detects pinned plugin refs so updates can be surfaced without auto-updating.
- **Fourth Voice API**: external reviewer integration (OpenAI/Anthropic/custom) for Rat sessions.
- **BitShit adapter**: stable interface for future BitShit integration, with both stub and runtime-backed implementations.

## BKG six-main commands

The BKG workflow uses six explicit commands:

```text
/0ero   — project check and orientation
/1brain  — memory operations (remember, look, decision, dump, validate)
/2hit    — git operations (status, down/pull, up/push, commit)
/3some   — task queue (add, run, list, show, update)
/4ever   — rules and done-check
/4ucker  — team debates, Agent Rat, votes, delegation
```

CLI helper scripts are installed to `~/.config/opencode/bin/` and can be used directly:

```bash
~/.config/opencode/bin/0ero check
~/.config/opencode/bin/1brain remember "decision text"
~/.config/opencode/bin/2hit status
~/.config/opencode/bin/3some list
~/.config/opencode/bin/4ever rules
~/.config/opencode/bin/4ucker team "problem description"
```

## Dashboard

Start the local dashboard during development:

```bash
npm run dashboard:start
```

Default URL:

```text
http://127.0.0.1:4774
```

Environment variables:

```bash
BKG_OC_DASHBOARD_HOST=127.0.0.1
BKG_OC_DASHBOARD_PORT=4774
```

Dashboard API endpoints currently include:

```text
GET /api/state
GET /api/summary
GET /api/live-output?after=<sequence>
POST /api/blocker
POST /api/rat/start
POST /api/vote
POST /api/user/approve
POST /api/user/reject
POST /api/user/revise
GET /api/vote/tally?ratSessionId=...
POST /api/tts/read
POST /api/fourth-voice/request
```

The **Subagent Output** panel updates roughly every 800 ms. OpenCode plugin
events are normalized, deduplicated, and written to a bounded local JSONL feed
so a separately started dashboard process can follow them live. The feed keeps
agent names, instance numbers, nesting depth, tool details, final text and a
clear finished state.

This behavior is inspired by the GPL-3.0 project
[`raisbecka/opencode-subagent-output`](https://github.com/raisbecka/opencode-subagent-output).
No third-party source file is vendored; the dashboard integration, event model,
storage bridge and UI are implemented in this package.

## Fourth Voice API

The Fourth Voice API allows external AI reviewers (OpenAI, Anthropic, or custom providers) to participate in Rat sessions. Configure your provider:

```bash
# Save config to ~/.local/share/opencode/fourth-voice.json
{
  "provider": "openai",
  "apiKey": "sk-...",
  "baseURL": "https://api.openai.com/v1",
  "model": "gpt-4o-mini"
}
```

Then call from the dashboard or via API:

```bash
POST /api/fourth-voice/request
{
  "ratSessionId": "rat-123",
  "prompt": "Review this decision for risks"
}
```

## BitShit adapter

Two adapter entry points exist:

```ts
import { createBitshitAdapter } from "./src/bitshit/adapter.js";
import { createRuntimeBitshitAdapter } from "./src/bitshit/runtime-adapter.js";
```

Use `createRuntimeBitshitAdapter()` for real plugin state. It delegates blockers, Rat sessions, votes and memory to the local runtime modules.

`createBitshitAdapter()` remains a compatibility stub and marks approval decisions with `isStub: true`.

## Agent coordination rules

Every helper agent must follow:

```text
docs/agent-work-contract.md
```

Lane prompts live in:

```text
docs/agent-lane-prompts.md
```

Hard rule:

```text
No claim, no work.
No evidence, no done.
No silent blocker.
```

This prevents five agents from simultaneously editing the same file and then acting surprised when Git turns into a crime scene.

## Development

Install dependencies:

```bash
npm ci
```

Run checks:

```bash
npm run lint:readme
npm run typecheck
npm run test
npm run build
npm pack --dry-run
```

Full CI-equivalent command:

```bash
npm run ci
```

## Test scope

The current test suite is contract-focused:

- update-notifier pinned plugin parsing
- Conclave session early-stop behavior
- BitShit runtime adapter smoke contract
- Dashboard API smoke and validation coverage
- Fourth Voice API client tests
- Rules loader with recursive directory support
- Memory short-term and worktree sync
- Delegation and subtask persistence
- Agent Rat and vote tally logic

More integration tests should be added as the dashboard review gate becomes executable.

## Security and release posture

- Dependencies are pinned to semver ranges, not `latest`.
- The package name avoids profanity and leetspeak to stay publishable and corporate-proxy-safe.
- The plugin does not auto-update dependencies or plugin refs.
- Update detection should only notify and never mutate config without explicit approval.
- Runtime decisions that affect work should flow through Rat, vote or user approval state.
- Fourth Voice API requires explicit configuration; no API keys are hardcoded.
- CLI helpers are installed with executable permissions but do not auto-run without user consent.

## License

MIT. See `LICENSE`.
