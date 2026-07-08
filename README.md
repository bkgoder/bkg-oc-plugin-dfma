# opencode

Development environment setup scripts for installing essential development tools.

## Overview

This repository provides automated installation scripts for the following development tools:

- **Rust** - Systems programming language (via rustup)
- **NVM** - Node Version Manager for managing Node.js versions
- **Python** - Programming language (via pyenv)
- **Conda** - Package and environment manager (Miniconda)
- **Docker** - Containerization platform

## Quick Start

### Install All Tools

To install all development tools at once:

```bash
./setup.sh --all
```

Or run interactively:

```bash
./setup.sh
```

### Install Individual Tools

You can also install tools individually:

```bash
./install_rust.sh      # Install Rust
./install_nvm.sh        # Install NVM
./install_python.sh     # Install Python via pyenv
./install_conda.sh      # Install Conda
./install_docker.sh     # Install Docker
```

## Detailed Installation Guide

### Rust Installation

The `install_rust.sh` script installs Rust using rustup, the official Rust installer:

```bash
./install_rust.sh
```

After installation, activate Rust in your current shell:

```bash
source $HOME/.cargo/env
```

Or add to your `~/.bashrc` or `~/.zshrc`:

```bash
source $HOME/.cargo/env
```

**What gets installed:**
- rustc (Rust compiler)
- cargo (Rust package manager)
- rustup (Rust toolchain installer)

### NVM Installation

The `install_nvm.sh` script installs NVM (Node Version Manager):

```bash
./install_nvm.sh
```

After installation, restart your shell or run:

```bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

**Usage examples:**
```bash
nvm install --lts        # Install latest LTS version
nvm install 18           # Install Node.js 18
nvm use 18               # Use Node.js 18
nvm list                 # List installed versions
```

### Python Installation

The `install_python.sh` script installs Python using pyenv:

```bash
./install_python.sh
```

Add to your `~/.bashrc` or `~/.zshrc`:

```bash
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

**Usage examples:**
```bash
pyenv install 3.11.7     # Install Python 3.11.7
pyenv global 3.11.7      # Set as default
pyenv versions           # List installed versions
```

### Conda Installation

The `install_conda.sh` script installs Miniconda:

```bash
./install_conda.sh
```

After installation, restart your shell or run:

```bash
source ~/miniconda3/bin/activate
```

**Usage examples:**
```bash
conda create -n myenv python=3.11    # Create environment
conda activate myenv                  # Activate environment
conda install numpy pandas            # Install packages
```

### Docker Installation

The `install_docker.sh` script installs Docker Engine (Linux) or provides instructions for Docker Desktop (macOS):

```bash
./install_docker.sh
```

**Linux:** After installation, log out and log back in for group permissions to take effect.

**macOS:** Install Docker Desktop from https://docs.docker.com/desktop/install/mac-install/

**Usage examples:**
```bash
docker --version              # Check Docker version
docker run hello-world        # Test installation
docker ps                     # List running containers
```

## System Requirements

### Linux (Ubuntu/Debian)
- Ubuntu 20.04+ or Debian 10+
- sudo access
- Internet connection
- curl installed

### Linux (Fedora/RHEL/CentOS)
- Fedora 36+, RHEL 8+, or CentOS 8+
- sudo access
- Internet connection
- curl installed

### macOS
- macOS 10.15 (Catalina) or later
- Internet connection
- curl installed

## Features

- ✅ Automated installation scripts
- ✅ Interactive and non-interactive modes
- ✅ Checks for existing installations
- ✅ Platform detection (Linux/macOS)
- ✅ Architecture detection (x86_64/ARM)
- ✅ Error handling and validation
- ✅ User prompts for confirmation
- ✅ Detailed installation logs

## Troubleshooting

### Rust
If you encounter issues with Rust:
```bash
rustup update           # Update Rust
rustup self uninstall   # Uninstall Rust completely
```

### NVM
If NVM commands are not found:
```bash
# Add to ~/.bashrc or ~/.zshrc
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
```

### Python/pyenv
If pyenv is not working:
```bash
# Ensure these are in your shell config
export PYENV_ROOT="$HOME/.pyenv"
export PATH="$PYENV_ROOT/bin:$PATH"
eval "$(pyenv init -)"
```

### Conda
If conda command is not found:
```bash
source ~/miniconda3/bin/activate
# Or restart your shell
```

### Docker
If you get permission errors:
```bash
# Add user to docker group (Linux)
sudo usermod -aG docker $USER
# Then log out and back in
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is open source and available under the MIT License.

## Support

For issues or questions:
- Open an issue on GitHub
- Check the official documentation for each tool:
  - [Rust](https://www.rust-lang.org/tools/install)
  - [NVM](https://github.com/nvm-sh/nvm)
  - [pyenv](https://github.com/pyenv/pyenv)
  - [Conda](https://docs.conda.io/)
  - [Docker](https://docs.docker.com/)
# bkg-oc-plugin-stop-4uck-m3-agen1s

OpenCode plugin pack that combines:

- persistent background delegation tools inspired by `kdcokenny/opencode-background-agents`
- plugin-template style package layout inspired by `zenobi-us/opencode-plugin-template`
- BKG six-main workflow commands
- visible 4ucker team debates
- Agent Rat planning council
- vote skills and vote audit
- installable OpenCode assets: commands, agents, skills and rules
- BitShit adapter interface
- Dashboard, memory, rules loader

## Package

```bash
npm install
npm run typecheck
npm run build
```

## OpenCode plugin

Main plugin entry: `src/index.ts`

The plugin exposes:

- **Background delegation** — `delegate()`, `delegation_read()`, `delegation_list()`
- **BitShit adapter** — `BitshitControlAdapter` with `reportBlocker`, `startRat`, `recordVote`, `requestApproval`, `remember`
- **Agent identity** — per-agent personality profiles
- **Memory** — short-term, worktree-sync, recall
- **Ensemble / Rat** — blocker-driven agent debates with votes
- **Dashboard** — blocker approval UI, TTS, fourth voice API
- **Rules loader** — `.mdc` rule discovery and validation

Delegation artifacts are persisted under:

```text
~/.local/share/opencode/delegations/
```

## BitShit Adapter

```ts
import { createBitshitAdapter, type BitshitControlAdapter } from "bkg-oc-plugin-stop-4uck-m3-agen1s"
const adapter = createBitshitAdapter()
await adapter.reportBlocker({ taskId, description, context })
await adapter.startRat({ blockerId, topic, agents })
await adapter.recordVote({ sessionId, agentId, choice, rationale })
```

## BKG workflow assets

## Configuration sync

Configure a private Git repository through the plugin environment:

```text
BKG_OPENCODE_SYNC_REPO=https://github.com/OWNER/PRIVATE-REPO.git
BKG_OPENCODE_SYNC_BRANCH=main
# Optional: BKG_OPENCODE_SYNC_LOCAL_PATH=~/.local/share/opencode-sync
```

The plugin exposes `sync_status`, `sync_push`, and `sync_pull`. Authentication files,
prompt history, and other secret paths are excluded by default. Pulls back up existing
local files below the plugin runtime directory before replacing them.

## Local review gate

`open_review_gate` opens a short-lived local browser review for blockers and Rat
decisions. The default workflow is `blocker-only`; supported modes are
`rat-only`, `blocker-only`, `manual`, `all-agents`, and `user-managed`.
Approve, reject, revise, annotations, and line-range edits are persisted into
plugin memory and linked Rat reviews also record the human vote. The server
stops after the decision.

Remote and browser behavior can be configured with:

```text
BKG_OC_REVIEW_REMOTE=1
BKG_OC_REVIEW_PORT=4774
BKG_OC_REVIEW_BROWSER=/path/to/browser
```

The equivalent `BKG_OC_DASHBOARD_REMOTE`, `BKG_OC_DASHBOARD_PORT`, and
`BKG_OC_DASHBOARD_BROWSER` variables are accepted as compatibility fallbacks.

Assets live under:

```text
assets/opencode/
  commands/
  agents/
  skills/
  rules/
```

Install them locally:

```bash
npm run install:assets
```

This copies the BKG commands, agents, skills and rules into `~/.config/opencode/`.

## Six main commands

Only these are main workflow commands:

- `0ero`
- `1brain`
- `2hit`
- `3some`
- `4ever`
- `4ucker`

Everything else is a subcommand.

## 4ucker system

`4ucker team` uses:

- `@bkg-4ucker-builder`
- `@bkg-4ucker-reviewer`
- `@bkg-4ucker-product`

`4ucker rat` uses:

- `@bkg-rat-architect`
- `@bkg-rat-builder`
- `@bkg-rat-reviewer`
- `@bkg-rat-product`
- `@bkg-rat-growth`
- `@bkg-rat-contrarian`

Votes use:

- `@bkg-vote-chair`
- `@bkg-vote-recorder`
- `@bkg-vote-auditor`

No visible vote record, no approval.

## Architecture

See `docs/plugin-ready-plan.md` for the full architecture and `docs/tasks.md` for the lane-based implementation plan.
