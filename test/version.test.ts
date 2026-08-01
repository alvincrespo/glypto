import { describe, it, expect } from 'vitest';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePackageVersion, readPackageVersion } from '../src/version.js';

const repoRoot = join(import.meta.dirname, '..');
const packageVersion = JSON.parse(
  readFileSync(join(repoRoot, 'package.json'), 'utf8')
).version as string;

const distEntry = join(repoRoot, 'dist', 'index.js');
const srcEntry = join(repoRoot, 'src', 'index.ts');

function runCli(args: string[], nodeArgs: string[] = []): string {
  return execFileSync(process.execPath, [...nodeArgs, ...args], {
    encoding: 'utf8',
    cwd: repoRoot,
  }).trim();
}

describe('readPackageVersion', () => {
  it('returns the version declared in package.json', () => {
    expect(readPackageVersion()).toBe(packageVersion);
  });

  it('returns a valid semver string', () => {
    expect(readPackageVersion()).toMatch(/^\d+\.\d+\.\d+(?:[-+].+)?$/);
  });

  it('does not return the placeholder that shipped in v0.1.0-v0.2.1', () => {
    // Regression guard for issue #87: the CLI hardcoded '1.0.0' from the
    // initial commit, so every release reported a version it was not.
    expect(readPackageVersion()).not.toBe('1.0.0');
  });
});

describe('parsePackageVersion', () => {
  it('extracts the version field', () => {
    expect(parsePackageVersion('{"version":"1.2.3"}', 'pkg')).toBe('1.2.3');
  });

  it.each([
    ['a missing version field', '{"name":"glypto"}'],
    ['a non-string version', '{"version":123}'],
    ['a null document', 'null'],
    ['a non-object document', '"glypto"'],
  ])('throws on %s', (_label, contents) => {
    expect(() => parsePackageVersion(contents, '/path/package.json')).toThrow(
      'Unable to read "version" from /path/package.json'
    );
  });

  it('propagates malformed JSON', () => {
    expect(() => parsePackageVersion('{not json', 'pkg')).toThrow();
  });
});

describe('glypto --version', () => {
  it('reports the package version when run from source (npm run dev)', () => {
    expect(runCli([srcEntry, '--version'], ['--import', 'tsx'])).toBe(
      packageVersion
    );
  });

  // The build runs before tests in CI, but `npm run test` on its own does not
  // produce dist/, so this only asserts when there is something to assert on.
  it.skipIf(!existsSync(distEntry))(
    'reports the package version when run from dist (npm start)',
    () => {
      expect(runCli([distEntry, '--version'])).toBe(packageVersion);
    }
  );
});
