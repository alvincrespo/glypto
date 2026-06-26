---
name: axc-cut-release
description: Cut a glypto release end to end. Resolves the target version (semver keyword like `patch`/`minor`/`major`, an explicit version like `0.3.0`, or — with no arg — the next patch), then drives a two-phase flow that respects the "PRs only, never push to main" rule. Phase 1 opens a version-bump PR. Phase 2 (after that PR merges) runs preflight and pushes the `vX.Y.Z` tag that triggers the npm publish. Use when the user says "/axc-cut-release", "cut a release", "ship a release", "publish a new version", or similar.
---

# Cut Release

Releases are tag-driven: pushing a `vX.Y.Z` tag fires `.github/workflows/release.yml`, which tests, builds, creates the GitHub Release, and publishes to npm via OIDC Trusted Publishing. The version in `package.json` on `main` must already equal the tag's version — and `main` only changes through a PR. So a release is two phases:

- **Phase 1 — bump:** branch, bump `package.json`, open a PR. The user merges it. (Stop here.)
- **Phase 2 — tag:** once `main` carries the new version, run preflight, then push the tag. CI publishes.

The skill figures out which phase it's in from repo state, so the user runs `/axc-cut-release` once to open the PR and again (after merging) to tag.

## Argument

Optional. One of:

- **A semver keyword** — `patch`, `minor`, or `major`. Computed off the current `main` version.
- **An explicit version** — `0.3.0`, or a prerelease like `0.3.0-rc.1`. Must match `^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$`. Prerelease tags (containing `alpha`/`beta`/`rc`) are auto-flagged as prereleases by `release.yml` — no extra handling needed here.
- **Nothing** — infer intent (see Phase detection). On a fresh cut, propose the next **patch** off the current version and confirm before doing anything.

## Resolve target version `V`

1. `git fetch origin main` and read the version from `origin/main`'s `package.json` → call it `cur`. (Read from `origin/main`, not the working tree, so a dirty/stale local checkout can't skew the math.)
2. Compute `V`:
   - Keyword arg → bump `cur` accordingly (`patch`: z+1; `minor`: y+1, z=0; `major`: x+1, y=0, z=0).
   - Explicit arg → `V = arg` (validate the regex above; reject otherwise).
   - No arg → if `cur` is **not yet tagged** (`v<cur>` missing locally and on origin), infer the user wants to tag the already-merged version: `V = cur`. Otherwise propose `V = patch-bump(cur)` and **confirm with the user before proceeding**.

## Phase detection

Compare `V` to `cur` (= `origin/main`'s version):

- **`cur == V`** → the bump is already on `main`. Go to **Phase 2 (tag)**. But first: if tag `v<V>` already exists (local or origin), this version is already released — stop and say so (retagging is a separate, destructive op, out of scope).
- **`cur != V`** → the bump isn't on `main` yet. Go to **Phase 1 (bump)**. First check for an existing open release PR for this version (`gh pr list --head release/v<V> --state open`). If one exists, don't open a duplicate — tell the user to merge it, then re-run to tag.

State the resolved version, the detected phase, and what will happen, before acting.

## Phase 1 — bump PR

Preconditions: working tree clean (`git status --porcelain` empty). If dirty, stop and ask the user to commit/stash first — this skill won't sweep up unrelated changes into a release branch.

Steps:

1. `git fetch origin main` (fresh), then create the branch off origin/main:
   `git checkout -b release/v<V> origin/main`
2. `npm version <V> --no-git-tag-version` — sets `package.json` to exactly `V` and updates `package-lock.json`. `--no-git-tag-version` is required: it writes the files without committing or tagging (the tag is Phase 2's job, and only after review/merge).
3. Commit both files:
   `git commit -am "release: v<V>"`
4. Push and open the PR:
   `git push -u origin release/v<V>`
   `gh pr create --base main --head release/v<V> --title "release: v<V>" --body "<body>"`
   - Body: one line stating the version bump (`cur → V`) and that merging it unblocks tagging `v<V>`. Note CI must be green before merge.
5. **Stop.** Report the PR URL and the exact next step:
   > PR #NN opened. Review and merge it, then run `/axc-cut-release <V>` to tag and publish.
   (Telling the user the **explicit** `V` avoids a keyword re-run recomputing a fresh bump.)

Opening a PR is reversible (close it), so Phase 1 proceeds without a yes/no gate — but always show the resolved version and branch name first.

## Phase 2 — tag & publish

This phase ends in an **irreversible npm publish**. It must run preflight and get an explicit confirmation before the tag push.

1. Be on `main`, clean, and up to date:
   - `git checkout main && git pull --ff-only origin main`
   - Confirm `package.json.version == V`. If not, something's off (PR not merged, or wrong `V`) — stop and explain.
2. **Run the `axc-cut-release-preflight` skill** with version `V`. It validates git state, `package.json`, `release.yml`, and the local build/test/pack. Proceed only on a green (✅) verdict. On 🟡, surface the warnings and ask the user whether to continue. On ❌, stop.
3. **Confirm with the user** before pushing — name the consequence explicitly:
   > Pushing `v<V>` triggers `release.yml`, which publishes glypto@<V> to npm. This can't be undone. Push the tag?
4. On yes:
   `git tag v<V> -m "Release v<V>"`
   `git push origin v<V>`
5. Report: the tag is pushed and CI is now building/testing/publishing. Link the Actions runs:
   `gh run list --workflow=release.yml --limit 1` (or print `https://github.com/alvincrespo/glypto/actions/workflows/release.yml`). Offer to watch it (`gh run watch`).

## What this skill does NOT do

- **Does not push to `main` directly, ever.** The version bump always goes through a PR the user merges.
- **Does not merge the PR for you.** Phase 1 stops at PR creation; the user controls the merge (per the project's PR-required rule).
- **Does not retag or force-push.** If `v<V>` already exists, it stops. Re-releasing a version is a deliberate, destructive operation outside this skill's scope.
- **Does not publish manually.** It never runs `npm publish` — only the tagged CI workflow does, so every release goes through the same gated, provenance-signed path.
- **Does not bypass preflight.** Phase 2 always validates before the irreversible push.

## Implementation hints

- Read `origin/main`'s package.json without checking it out: `git show origin/main:package.json` piped to a JSON parse, or `gh api repos/alvincrespo/glypto/contents/package.json`. Prefer the `git show` form — no extra network round trip after `git fetch`.
- Tag existence check covers both local and remote: `git tag -l v<V>` and `git ls-remote --tags origin v<V>`.
- Semver bump math: split `cur` on `.`; a prerelease suffix on `cur` (rare on `main`) means keyword bumps are ambiguous — if `cur` has a `-suffix`, ask the user for an explicit `V` rather than guessing.
- Run independent read-only checks (fetch, tag lookup, PR lookup) together in one message.
- Keep messages tight: state version, phase, action, result. The user is cutting a release, not reading a tutorial.
