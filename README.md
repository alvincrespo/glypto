# Glypto

[![CI](https://github.com/alvincrespo/glypto/actions/workflows/ci.yml/badge.svg)](https://github.com/alvincrespo/glypto/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
![NPM Downloads](https://img.shields.io/npm/dm/glypto)

A TypeScript CLI tool for scraping metadata from a website using a provider-based architecture.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Contributing](#contributing)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Programmatic Usage](#programmatic-usage)
  - [Simple Usage with Factory](#simple-usage-with-factory)
  - [Advanced Usage with Custom Providers](#advanced-usage-with-custom-providers)
  - [Manual Registry Setup](#manual-registry-setup)
- [Architecture](#architecture)
  - [Core Components](#core-components)
  - [Provider System](#provider-system)
  - [Project Structure](#project-structure)
- [Creating Custom Providers](#creating-custom-providers)
- [Development](#development)
- [Testing](#testing)
  - [Testing Package Installation](#testing-package-installation)
  - [Testing The Source](#testing-the-source)
    - [Test Structure](#test-structure)
    - [Writing Tests](#writing-tests)
    - [Coverage Reports](#coverage-reports)
- [CI/CD](#cicd)
- [API Reference](#api-reference)
  - [Factory Functions](#factory-functions)
  - [Classes](#classes)
  - [Interfaces](#interfaces)
- [Requirements](#requirements)
- [License](#license)

## Overview

Glypto scrapes metadata from websites including titles, descriptions, images, Open Graph data, Twitter Cards, and RSS/Atom feeds. It features a modular provider system that makes it easy to add support for new metadata formats.

## Features

- 🔍 **Comprehensive Metadata Scraping**: Open Graph, Twitter Cards, standard meta tags, and more
- 🧩 **Extensible Provider System**: Plug-and-play architecture for adding new metadata sources
- 🚀 **Auto-Discovery**: Automatically loads providers from the providers directory
- ⚡ **Modern TypeScript**: Full type safety with ES modules
- 🎯 **Priority-Based Resolution**: Intelligent fallback system for metadata values
- 📦 **Multiple Usage Patterns**: CLI tool, programmatic API, or factory functions

# Installation

```bash
# Global installation
npm i -g glypto

# Local project installation
npm i glypto
```

## Contributing

```bash
# Clone the repository
git clone <repository-url>
cd glypto

# Install dependencies
npm install

# Build the project
npm run build
```

## CLI Usage

```bash
# Run the scraping command
./bin/glypto scrape

# Or use npm start for development
npm start
```

The CLI will prompt you for a URL and scrape all available metadata from the webpage.

## Programmatic Usage

### Simple Usage with Factory

```typescript
import { scrapeMetadata, createScraper } from 'glypto';
import { JSDOM } from 'jsdom';

// Direct scraping
const dom = new JSDOM(htmlContent);
const metadata = await scrapeMetadata(dom.window.document);

console.log(metadata.title); // Page title
console.log(metadata.description); // Page description
console.log(metadata.image); // Featured image
console.log(metadata.url); // Canonical URL
console.log(metadata.siteName); // Site name
console.log(metadata.favicon); // Favicon URL
console.log(metadata.feeds); // RSS/Atom feeds
```

### Advanced Usage with Custom Providers

```typescript
import {
  createScraperWithProviders,
  OpenGraphProvider,
  TwitterProvider,
} from 'glypto';

// Create scraper with only specific providers
const scraper = createScraperWithProviders([
  new OpenGraphProvider(),
  new TwitterProvider(),
]);

const metadata = await scraper.scrape(document);
```

### Manual Registry Setup

```typescript
import { ProviderRegistry, ProviderLoader, Scraper } from 'glypto';

const loader = new ProviderLoader();
const providers = await loader.loadFromDirectory('./custom-providers');
const registry = new ProviderRegistry(providers);
const scraper = new Scraper(registry);
```

## Architecture

Glypto uses a modular provider architecture with clear separation of concerns:

### Core Components

- **`Scraper`**: Main scraping engine with fluent method chaining
- **`ProviderRegistry`**: Manages and prioritizes metadata providers
- **`ProviderLoader`**: Dynamically loads providers from directories
- **`Metadata`**: Result object with intelligent value resolution

### Provider System

Built-in providers include:

- **`OpenGraphProvider`**: Scrapes `og:*` properties (priority 1)
- **`TwitterProvider`**: Scrapes `twitter:*` properties (priority 2)
- **`StandardMetaProvider`**: Scrapes standard meta tags (priority 3)
- **`OtherElementsProvider`**: Scrapes `<title>`, `<h1>`, `<link>` tags (priority 4)
- **`JsonLdProvider`**: Example JSON-LD structured data provider

### Project Structure

```
src/
├── scraper.ts                  # Main scraping engine
├── metadata.ts                 # Result data structure
├── provider-registry.ts        # Provider management
├── provider-loader.ts          # Dynamic provider loading
├── factory.ts                  # Convenience factory functions
├── exports.ts                  # Public API exports
├── types.ts                    # TypeScript interfaces and types
├── providers/                  # Built-in providers
│   ├── open-graph-provider.ts
│   ├── twitter-provider.ts
│   ├── standard-meta-provider.ts
│   ├── other-elements-provider.ts
│   └── json-ld-provider.ts
└── index.ts                    # CLI entry point
```

## Creating Custom Providers

Create a new provider by implementing the `MetadataProvider` interface:

```typescript
// src/providers/my-custom-provider.ts
import { MetadataProvider } from '../types.js';

export class MyCustomProvider implements MetadataProvider {
  readonly name = 'myCustom';
  readonly priority = 1.5; // Between OpenGraph (1) and Twitter (2)

  canHandle(element: Element): boolean {
    // Return true if this provider can scrape from this element
    return element.getAttribute('data-my-meta') !== null;
  }

  scrape(element: Element): { key: string; value: string } | null {
    // Scrape data from the element
    const value = element.getAttribute('data-my-meta');
    return value ? { key: 'customField', value } : null;
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    // Resolve value for a given key
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}
```

The provider will be automatically discovered and loaded when placed in the `providers/` directory.

## Development

```bash
# Development mode with auto-reload
npm run dev

# Build for production
npm run build

# Watch mode for development
npm run watch

# Lint and format
npm run lint
npm run format
```

## Testing

### Testing Package Installation

Please read [Local Install Testing](./docs/local-install-testing.md)

### Testing The Source

The project uses [Vitest](https://vitest.dev/) for testing with TypeScript and ESM support.

```bash
# Run tests once
npm test

# Run tests in watch mode (development)
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with interactive UI
npm run test:ui
```

#### Test Structure

Tests are organized in the `test/` directory with the following structure:

```
test/
├── setup.ts                        # Test setup and global mocks
├── metadata.test.ts                # Tests for Metadata class
├── scraper.test.ts                 # Tests for Scraper class
├── factory.test.ts                 # Tests for factory functions
├── provider-registry.test.ts       # Tests for ProviderRegistry
├── provider-loader.test.ts         # Tests for ProviderLoader
├── open-graph-provider.test.ts     # Tests for OpenGraph provider
├── twitter-provider.test.ts        # Tests for Twitter provider
├── standard-meta-provider.test.ts  # Tests for standard meta provider
├── other-elements-provider.test.ts # Tests for other elements provider
└── json-ld-provider.test.ts        # Tests for JSON-LD provider
```

#### Writing Tests

Tests use Vitest with jsdom for DOM testing:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { Scraper } from '../src/scraper.js';

describe('MyFeature', () => {
  it('should work correctly', () => {
    const dom = new JSDOM('<html><head><title>Test</title></head></html>');
    const document = dom.window.document;

    // Your test code here
    expect(document.title).toBe('Test');
  });
});
```

#### Coverage Reports

Coverage reports are generated in multiple formats:

- **Terminal**: Shows coverage summary in the console
- **HTML**: Interactive report in `coverage/index.html`
- **JSON**: Machine-readable report in `coverage/coverage-final.json`

The project maintains **97.73%** statement coverage with comprehensive tests across all components. Interface-only files (`types.ts`) and CLI entry points are excluded from coverage for cleaner metrics.

The coverage directory is automatically excluded from git commits.

## CI/CD

The project uses GitHub Actions for continuous integration and deployment:

### Workflows

- **`ci.yml`**: Main CI pipeline that runs on every push and pull request
  - Tests across Node.js versions 20.x, 22.x, and 24.x
  - Runs linting, type checking, building, and testing
  - Uploads coverage reports as artifacts
  - Includes security auditing and dependency checking

- **`release.yml`**: Automated releases
  - Triggers on version tags (v\*)
  - Creates GitHub releases with assets
  - Ready for npm publishing (commented out)

- **`dependabot-auto-merge.yml`**: Automated dependency updates
  - Auto-merges minor and patch updates from Dependabot
  - Requires tests to pass before merging

- **`stale.yml`**: Issue and PR management
  - Marks inactive issues/PRs as stale
  - Automatically closes after extended inactivity

- **`labeler.yml`**: Automatic labeling
  - Labels PRs based on changed files
  - Helps with project organization

### Branch Protection

Configure branch protection rules for `main`:

- Require status checks to pass
- Require branches to be up to date
- Require review from code owners
- Dismiss stale reviews when new commits are pushed

### Secrets Required

For full functionality, configure these secrets in your repository:

- `NPM_TOKEN`: For npm publishing (if enabled)

## API Reference

### Factory Functions

- **`createScraper()`**: Creates scraper with auto-loaded providers
- **`createScraperWithProviders(providers)`**: Creates scraper with specific providers
- **`scrapeMetadata(document)`**: One-shot scraping function

### Classes

- **`Scraper`**: Main scraping engine
- **`ProviderRegistry`**: Provider management and resolution
- **`ProviderLoader`**: Dynamic provider loading
- **`Metadata`**: Result object with getter methods

### Interfaces

All TypeScript interfaces are located in `src/types.ts`:

- **`MetadataProvider`**: Interface for implementing custom providers
- **`ProviderData`**: Interface for provider data aggregation
- **`Feed`**: Interface for RSS/Atom feed data

## Requirements

- Node.js 24.4.0+ (specified in `.node-version`)
- TypeScript 5.0+

## License

MIT LICENSE - See LICENSE file for details
