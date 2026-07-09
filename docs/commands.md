# BKG command reference

This plugin exposes six top-level OpenCode commands. Every visible command starts with `bkg-` and describes the action it performs.

## Current top-level commands

| Command | Purpose | Use when |
|---|---|---|
| `/bkg-project-check` | Inspect repository, docs, state and starting context. | You need orientation before editing. |
| `/bkg-memory` | Read, write, validate and summarize project memory. | A decision, result or blocker must be remembered. |
| `/bkg-git` | Check status, pull, review diff, commit and push explicitly. | You need Git movement with visible evidence. |
| `/bkg-tasks` | Add, run, list, show and update tasks. | Work needs to be tracked before anyone claims it is done. |
| `/bkg-rules` | Check workflow rules, done criteria and release gates. | A result looks finished but still needs proof. |
| `/bkg-debate` | Start team debates, Agent Rat sessions, votes and delegation. | A plan, blocker, feature or approval needs multiple perspectives. |

## Command discipline

These commands are the only top-level workflow commands. Everything else must stay a subcommand, skill, tool or agent action.

Expected work loop:

1. Start with `/bkg-project-check` to inspect state.
2. Use `/bkg-tasks` to create or select a concrete task.
3. Use `/bkg-debate` for blockers, plans, feature decisions or release approvals.
4. Use `/bkg-git` for visible Git movement.
5. Use `/bkg-rules` before claiming work is done.
6. Use `/bkg-memory` to save the result and relevant decisions.

## Legacy names

The old numeric and ambiguous command names are not primary commands anymore:

- `/0ero`
- `/1brain`
- `/2hit`
- `/3some`
- `/4ever`
- `/4ucker`
- `/bkg-zero`
- `/bkg-brain`
- `/bkg-hit`
- `/bkg-some`
- `/bkg-ever`
- `/bkg-fucker`

They should not be documented as active commands. If they appear after installation, reinstall assets and restart OpenCode.

## Local verification

After pulling the repository:

1. Run `npm run install:assets`.
2. Restart OpenCode.
3. Open `/` command search.
4. Confirm only the six current top-level BKG commands are visible.

If legacy commands still appear, the local OpenCode config likely still contains stale copied command files. Remove the old command files from the local OpenCode commands directory and reinstall assets.
