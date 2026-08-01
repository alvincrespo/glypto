import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Reads the package version from package.json at runtime.
 *
 * The version is deliberately not duplicated in source: a hardcoded string
 * silently drifts from the released version (see issue #87). npm always
 * includes package.json in the published tarball regardless of the `files`
 * allowlist, so it is available at runtime.
 *
 * `../package.json` resolves correctly from every entry path because both
 * `src/` and `dist/` sit one level below the package root:
 *
 * - `src/version.ts`  via tsx  -> <root>/package.json
 * - `dist/version.js` via node -> <root>/package.json
 * - a global install          -> <prefix>/node_modules/glypto/package.json
 *
 * `import.meta.dirname` is used rather than `new URL('../', import.meta.url)`
 * because the global `URL` is not always Node's: under a jsdom test
 * environment it resolves to jsdom's subclass, which rejects a relative
 * reference against a `file:` base.
 */
export function readPackageVersion(): string {
  const packageJsonPath = join(import.meta.dirname, '..', 'package.json');

  return parsePackageVersion(
    readFileSync(packageJsonPath, 'utf8'),
    packageJsonPath
  );
}

/**
 * Extracts and validates the `version` field from package.json contents.
 *
 * Split out from {@link readPackageVersion} so the validation is reachable in
 * tests without mocking the filesystem. Internal — not part of the public API
 * surface in `exports.ts`.
 */
export function parsePackageVersion(contents: string, source: string): string {
  const parsed: unknown = JSON.parse(contents);

  if (
    typeof parsed !== 'object' ||
    parsed === null ||
    !('version' in parsed) ||
    typeof parsed.version !== 'string'
  ) {
    throw new Error(`Unable to read "version" from ${source}`);
  }

  return parsed.version;
}
