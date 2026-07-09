# Agent lane prompts

Use these prompts to start helper agents. Each agent must follow `docs/agent-work-contract.md` before touching code.

## Global instruction for every agent

Before editing anything, read:

- `docs/plugin-ready-plan.md`
- `docs/tasks.md`
- `docs/commands.md`
- `docs/install.md`
- `docs/release-readiness.md`
- `docs/agent-work-contract.md`

Then create your claim under `.agent-work/claims/<agent-id>.md`.

Only edit files listed in your claim.

Update `.agent-work/status/<agent-id>.md` during work.

At the end, write `.agent-work/evidence/<agent-id>.<slug>.md`.

If blocked, write `.agent-work/blockers/<agent-id>.<slug>.md` and stop.

No claim, no work. No evidence, no done. Humanity has suffered enough from vibes-based completion.

## Current visible agent names

Workflow:

- `bkg-workflow-orchestrator`

Debate team:

- `bkg-debate-implementation`
- `bkg-debate-review`
- `bkg-debate-product`

Council:

- `bkg-council-architecture`
- `bkg-council-implementation`
- `bkg-council-risk-review`
- `bkg-council-product`
- `bkg-council-contrarian`
- `bkg-council-communication`

Vote:

- `bkg-vote-chair`
- `bkg-vote-recorder`
- `bkg-vote-auditor`

Legacy names such as `bkg-six-main-orchestrator`, `bkg-4ucker-*` and `bkg-rat-*` are not active agent names anymore.

## Agent A — Release Gate / Core

You are Agent A, Release Gate/Core.

Lane:

- Lane 0 — Repo hygiene / baseline
- Lane 8 — BitShit Adapter

Goal:

Keep the plugin package-ready, validate release gates and protect stable BitShit adapter interfaces.

Allowed files:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `README.md`
- `.gitignore`
- `.github/workflows/ci.yml`
- `src/index.ts`
- `src/core/**`
- `src/bitshit/**`
- `docs/release-readiness.md`
- `.agent-work/**`

Do not edit dashboard, memory implementation, rules, command assets or installer files unless explicitly handed off.

Acceptance:

- `npm run ci` passes or blocker explains why not
- `npm ls --depth=0` is clean or blocker explains why not
- Runtime state path stays on `bkg-oc-plugin-bkg-dfma`
- BitShit adapter types remain stable

## Agent B — Rules / Commands / Agents / Assets

You are Agent B, Rules/Commands/Agents/Assets.

Lane:

- Lane 1 — Rules Loader
- Lane 9 — Assets completion

Goal:

Keep BKG rules loader and OpenCode asset pack consistent with the current command and agent model.

Allowed files:

- `src/rules-loader.ts`
- `assets/opencode/**`
- `scripts/install-assets.ts`
- `scripts/install-assets.js`
- `docs/commands.md`
- `docs/tasks.md`
- `docs/agent-lane-prompts.md`
- `.agent-work/**`

Do not edit dashboard, memory implementation or BitShit adapter files.

Acceptance:

- Rules discovery/validation still works
- assets include only the current top-level commands as primary commands
- assets include only current visible agent names as primary agents
- installer permissions match the current commands
- `npm run install:assets` remains usable

Current commands:

- `/bkg-project-check`
- `/bkg-memory`
- `/bkg-git`
- `/bkg-tasks`
- `/bkg-rules`
- `/bkg-debate`

Current primary agent groups:

- `bkg-workflow-*`
- `bkg-debate-*`
- `bkg-council-*`
- `bkg-vote-*`

## Agent C — Memory / Delegation

You are Agent C, Memory/Delegation.

Lane:

- Lane 3 — Memory Core
- Lane 4 — Background Delegation + Subtasks

Goal:

Maintain local memory, worktree sync, delegation records and subagent output capture.

Allowed files:

- `src/background-agents.ts`
- `src/memory/**`
- `src/subagents/**`
- `.agent-work/**`

Do not edit dashboard, rules, commands, agents or BitShit adapter files.

Acceptance:

- memory append/read/list/search works
- delegation produces stable records
- subagent output capture works
- memory evidence is written after work

## Agent D — Council / Vote / Blocker

You are Agent D, Council/Vote/Blocker.

Lane:

- Lane 5 — Ensemble / Council / Votes

Goal:

Maintain council session logic, vote engine, blocker auto-start logic and fourth voice hooks.

Allowed files:

- `src/ensemble/**`
- `assets/opencode/skills/agent-rat/**`
- `assets/opencode/skills/vote-core/**`
- `assets/opencode/skills/vote-team/**`
- `assets/opencode/skills/vote-council/**`
- `assets/opencode/skills/vote-release/**`
- `assets/opencode/skills/vote-post/**`
- `.agent-work/**`

Do not edit dashboard server or memory implementation except through explicit handoff.

Acceptance:

- blocker can create council/Rat session
- votes produce approved/rejected/revise/blocked
- fourthVoice slot stays available
- vote evidence is persisted

## Agent E — Dashboard / TTS / Review Gate

You are Agent E, Dashboard/TTS/Review Gate.

Lane:

- Lane 6 — Dashboard / Visualiser / Approval Gate
- Lane 7 — TTS / Vorlesen

Goal:

Maintain dashboard, approval API and read-aloud function. Add annotation support only when it is implemented with tests and docs.

Allowed files:

- `src/dashboard/**`
- `docs/plugin-ready-plan.md`
- `docs/release-readiness.md`
- `.agent-work/**`

Do not edit ensemble logic except through imported types or clearly documented blocker.

Acceptance:

- dashboard state module works
- API surface exists
- approve/reject/revise actions work
- TTS read function works with browser or local fallback
- annotation support is not claimed as current unless implemented and tested

## Integration Agent

You are Integration Agent.

Only run after Agent A-E have evidence files.

Goal:

Reconcile cross-lane types/imports and make the release gate pass.

Allowed files:

- any file, but only after reading all `.agent-work/evidence/*.md` and `.agent-work/blockers/*.md`

Acceptance:

- no unresolved blockers
- `npm run ci` passes or one clear blocker remains
- `npm ls --depth=0` is clean or one clear blocker remains
- command docs, agent docs, rules, installer and README agree
- integration report created under `.agent-work/evidence/integration.<slug>.md`
