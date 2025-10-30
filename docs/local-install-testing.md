# Local NPM Package Testing for `glypto`

## Testing Project Installation

This simulates a real publish without hitting the registry.

```bash
# From the glypto repo
npm run build
npm pack --dry-run        # preview contents
npm pack                  # creates ./glypto-<version>.tgz

# In a clean consumer project
mkdir -p /tmp/glypto-consumer
cd /tmp/glypto-consumer
npm init -y
npm pkg set type=module
npm install /path/to/glypto-<version>.tgz

# CLI works?
./node_modules/.bin/glypto --help

# Programmatic import works?
node -e "import * as lib from 'glypto'; console.log(Object.keys(lib).slice(0,8))"
```

## Testing Global Installation

```bash
# From the glypto repo
rm -rf dist                           # removes the dist directory (if it exists)
rm glpyto-X.Y.Z.tgs                   # Replace X.Y.Z with the semver created locally, or don't if it doesn't exist
npm run build
npm pack --dry-run                    # preview contents
npm pack                              # creates ./glypto-<version>.tgz

# Install globally
npm install -g glypto-<version>.tgz   # install the package globally

# CLI works?
glypto --version
---
