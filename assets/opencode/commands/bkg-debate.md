---
description: BKG debate command. Run team debates, council sessions, votes and background delegation.
agent: bkg-workflow-orchestrator
---

Use skills:

- bkg-six-main-flow
- 4ucker-debate
- agent-rat
- vote-core
- vote-team
- vote-council
- vote-release
- vote-post

Run shell/helper or plugin tools as needed.

Subcommands:

- `team "problem"` visible 3-agent debate
- `council <plan|problem|feature|post|decide> "topic"` council review
- `vote <team|council|release|post|feature> "decision"` vote protocol
- `delegate "prompt" "agent"` persistent background delegation

Required visible agents for team:

- `@bkg-debate-implementation`
- `@bkg-debate-review`
- `@bkg-debate-product`

Required council agents:

- `@bkg-council-architecture`
- `@bkg-council-implementation`
- `@bkg-council-risk-review`
- `@bkg-council-product`
- `@bkg-council-contrarian`
- `@bkg-council-communication`

Required vote agents:

- `@bkg-vote-chair`
- `@bkg-vote-recorder`
- `@bkg-vote-auditor`

No visible vote record, no approval.
