---
name: release-preflight
description: Run safety checks before tagging a glypto release. Validates that the repo, package.json, and release.yml are in a state where pushing a `vX.Y.Z` tag will result in a successful npm publish via Trusted Publishing. Read-only — never modifies files or git state.
---

# Release Preflight

Run before tagging a release. Catches the issues that have actually broken glypto releases — token type mismatches, missing OIDC permissions, mismatched repository metadata, stale main, retag collisions.

## Argument

The skill takes an optional version arg (e.g. `0.2.1`). If omitted, read `package.json.version` and confirm with the user that's the release they're planning.

## Checks (run all, report each, don't stop on failure)

Group results into four sections. For each check, print a single line `✓` or `✗` plus a one-line explanation. End with an overall verdict.

### 1. Git state

- **Working tree clean** — `git status --porcelain` returns empty.
- **On `main`** — `git rev-parse --abbrev-ref HEAD` == `main`.
- **Up to date with origin** — `git fetch origin main` then compare `git rev-parse main` to `git rev-parse origin/main`.
- **Tag `v<version>` does not exist** — neither locally (`git tag -l v<version>`) nor on origin (`git ls-remote --tags origin v<version>`). If it does exist, that's a hard block — retagging is a separate destructive op the user must explicitly authorize.

### 2. package.json

- **`version` matches arg** — if user passed a version, `package.json.version` should equal it. If they don't match, point out the mismatch; either the user forgot to bump or passed the wrong arg.
- **`repository.url` is set and matches the GitHub remote** — read `git config --get remote.origin.url` (normalize SSH↔HTTPS), compare to `package.json.repository.url`. Mismatch breaks the npm provenance attestation with a 422.
- **`engines.node` exists** — Trusted Publishing isn't affected by this, but glypto specifically declared `engines.node: ">=24.4.0"` in v0.2.0 and shouldn't regress.

### 3. release.yml (`.github/workflows/release.yml`)

- **`permissions.id-token: write`** — required for OIDC token minting.
- **`permissions.contents: write`** — required for `softprops/action-gh-release` to create the GitHub Release.
- **npm upgrade step present** — there should be a step that runs `npm install -g npm@latest` (or pins ≥11.5.1) before `npm publish`. Trusted Publishing requires npm ≥ 11.5.1.
- **Publish step uses `--provenance --access public`** — both flags. `--provenance` is the whole point of trusted publishing; `--access public` is required for unscoped public packages.
- **Publish step does NOT set `NODE_AUTH_TOKEN`** — if it does, npm tries token auth and fails with `EOTP` or `404`. The publish step should have no `env:` block at all (or at least no `NODE_AUTH_TOKEN`).

### 4. Local build

Only run if checks 1–3 all passed (no point running tests on a broken state):

- **`npm run lint`** clean
- **`npm run build`** clean
- **`npm test`** — all tests pass
- **`npm pack --dry-run`** — tarball declares the right `version`, includes `dist/`, `bin/`, `README.md`, `LICENSE`

## Verdict

End with one of:

- ✅ **Ready to release.** — all checks passed. Suggest the next commands the user should run:
  ```
  git tag v<version>
  git push origin v<version>
  ```
- 🟡 **Mostly ready, but…** — non-blocking issues (e.g. `engines.node` missing). Show what's odd and let the user decide.
- ❌ **Blocked.** — one or more hard failures. List them and don't suggest tagging.

## What the skill does NOT do

- **Does not modify anything.** Read-only by design — no git operations beyond `fetch`, no edits to files, no commits, no tag creation, no pushes. The user runs the actual `git tag` / `git push` themselves after seeing the green light.
- **Does not check the npm registry.** Verifying that the package's Trusted Publisher is configured on npmjs.com would require API calls; not worth it. Assume it's configured (it's a one-time setup).
- **Does not auto-fix problems.** If a check fails, explain what's wrong and what the fix would be — but don't apply it. The user opens a PR with the fix.

## Implementation hints

- Run independent checks in parallel where possible (multiple Bash calls in one message).
- For SSH↔HTTPS normalization on the remote URL: strip `git@github.com:` prefix and `.git` suffix, prepend `https://github.com/`, then compare.
- For YAML parsing of `release.yml`: use `python3 -c "import yaml; ..."` or read the file and grep — both are fine. Don't pull in a dependency.
- Be precise in failure messages — include the exact value found vs. expected, so the user can act without re-investigating.
