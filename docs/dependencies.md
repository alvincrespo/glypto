# Working with Dependencies

## TL;DR

Use the Node version this repo pins before you touch `package-lock.json`:

```bash
nvm use          # reads .nvmrc  -> latest 24.x
# or: fnm use / nodenv install   -> reads .node-version
```

Then run whatever npm command you need. Afterwards, sanity-check the diff:

```bash
git diff --stat package-lock.json
```

If the diff is much larger than the change you intended, you regenerated the
lockfile with the wrong npm. Reset and try again:

```bash
git checkout package-lock.json
```

## Why this matters

`package-lock.json` carries per-package metadata that npm only writes if it
understands the field. **An npm older than the one that generated the lockfile
silently deletes metadata it does not recognise.** Nothing warns you; the
install succeeds and the loss shows up only as extra noise in your diff.

The field that bites this project is `libc`:

```json
"node_modules/@esbuild/linux-x64": {
  "cpu": ["x64"],
  "os": ["linux"],
  "libc": ["glibc"],
  "optional": true
}
```

npm uses `libc` to pick the correct prebuilt native binary on glibc systems
(most distros) versus musl systems (Alpine, and Alpine-based CI images). Strip
it and npm loses the ability to distinguish them, so it can install a glibc
build into a musl container. Today the affected packages are `esbuild` and
`lightningcss`, both dev-only, so the blast radius is small — but the failure is
silent and sails through code review as "just lockfile noise".

## The npm floor

`libc` is preserved from **npm 11.11.0** onward. Measured against this repo's
lockfile, which contains 10 `libc` entries:

| npm      | `libc` entries after `npm install --package-lock-only` |
| -------- | ------------------------------------------------------ |
| 11.5.0   | 0 — strips                                             |
| 11.7.0   | 0 — strips                                             |
| 11.9.0   | 0 — strips                                             |
| 11.10.0  | 0 — strips                                             |
| 11.11.0  | 10 — preserves                                         |
| 11.12.0+ | 10 — preserves                                         |

The earliest Node 24 release shipping npm 11.11.0 is **v24.14.1**. Anything
older strips the field, including Node 24.4.0 — which is what `.node-version`
used to pin, and why this kept happening.

## Why `engines` does not protect you

`package.json` declares:

```json
"engines": { "node": ">=24.4.0" }
```

That is a _runtime_ contract for people installing the published CLI, and
24.4.0 is a perfectly fine version to _run_ glypto on. It says nothing about
which npm is fit to _generate_ a lockfile, and 24.4.0 ships npm 11.4.2, which is
below the floor. Raising `engines` would lock out end users for a problem that
only affects contributors, so the version pins carry that job instead:

| File            | Value  | Read by                     |
| --------------- | ------ | --------------------------- |
| `.nvmrc`        | `24`   | nvm                         |
| `.node-version` | `24`   | fnm, nodenv, asdf, volta    |
| `ci.yml`        | `24.x` | GitHub Actions `setup-node` |

All three track the latest 24.x, so local and CI resolve to the same release and
cannot drift apart.

## CI guard

The `Lockfile Guard` job in `ci.yml` runs on pull requests and compares the
number of `libc` entries in `package-lock.json` against the base branch. If the
count drops, the job fails with instructions to regenerate.

The guard is deliberately narrow — it detects the one symptom that is both
damaging and invisible in review. It does not attempt to catch every kind of
lockfile churn.

**If the guard fails and you did not touch the lockfile metadata**, regenerate
with the pinned Node:

```bash
git checkout package-lock.json
nvm use
npm install --package-lock-only
```

**If you legitimately removed a dependency** that carried `libc` metadata, the
count drop is expected and correct. Confirm the removed entries belong to the
package you dropped, then note it in the PR description so a reviewer can
approve the failure knowingly.
