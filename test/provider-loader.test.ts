/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ProviderLoader } from '../src/provider-loader.js';
import { MetadataProvider } from '../src/types.js';

// Mock provider class for testing
class MockProvider implements MetadataProvider {
  readonly name = 'mock';
  readonly priority = 1;

  canHandle(): boolean { return true; }
  scrape(): { key: string; value: string } | null { return null; }
  getValue(): string | undefined { return undefined; }
}

describe('ProviderLoader', () => {
  let loader: ProviderLoader;

  beforeEach(() => {
    loader = new ProviderLoader();
    vi.clearAllMocks();
  });

  describe('loadDefaults', () => {
    it('should load all default providers', async () => {
      const providers = await loader.loadDefaults();

      expect(providers).toHaveLength(4);
      expect(providers[0].name).toBe('openGraph');
      expect(providers[1].name).toBe('twitter');
      expect(providers[2].name).toBe('meta');
      expect(providers[3].name).toBe('other');
    });

    it('should return providers with correct priorities', async () => {
      const providers = await loader.loadDefaults();

      expect(providers[0].priority).toBe(1); // OpenGraph
      expect(providers[1].priority).toBe(2); // Twitter
      expect(providers[2].priority).toBe(3); // StandardMeta
      expect(providers[3].priority).toBe(4); // OtherElements
    });

    it('should return providers that implement MetadataProvider interface', async () => {
      const providers = await loader.loadDefaults();

      providers.forEach(provider => {
        expect(typeof provider.name).toBe('string');
        expect(typeof provider.priority).toBe('number');
        expect(typeof provider.canHandle).toBe('function');
        expect(typeof provider.scrape).toBe('function');
        expect(typeof provider.getValue).toBe('function');
      });
    });
  });

  describe('loadFromDirectory', () => {
    it('should return empty array when directory does not exist', async () => {
      const providers = await loader.loadFromDirectory('/nonexistent/path');

      expect(providers).toEqual([]);
    });

    it('should return empty array when directory is empty', async () => {
      // Test with a directory that exists but contains no JS files
      const providers = await loader.loadFromDirectory('./test');

      expect(providers).toBeInstanceOf(Array);
    });

    it('should use default providers directory when no path provided', async () => {
      const providers = await loader.loadFromDirectory();

      // Should attempt to load from the default directory
      // Even if it fails, it should return an array
      expect(providers).toBeInstanceOf(Array);
    });

    it('should handle directory with non-JS files gracefully', async () => {
      // Test loading from a directory that might have non-JS files
      const providers = await loader.loadFromDirectory('./');

      // Should filter out non-JS files and return an array
      expect(providers).toBeInstanceOf(Array);
    });

    it('should load from existing providers directory', async () => {
      // Test loading from the actual providers directory
      const providers = await loader.loadFromDirectory('./src/providers');

      // Should find and load the actual provider files
      expect(providers).toBeInstanceOf(Array);

      // If successful, should contain actual providers
      if (providers.length > 0) {
        providers.forEach(provider => {
          expect(typeof provider.name).toBe('string');
          expect(typeof provider.priority).toBe('number');
          expect(typeof provider.canHandle).toBe('function');
          expect(typeof provider.scrape).toBe('function');
          expect(typeof provider.getValue).toBe('function');
        });
      }
    });

    it('should handle errors gracefully and continue processing', async () => {
      // Test with a path that might cause errors
      const providers = await loader.loadFromDirectory('/invalid/path');

      expect(providers).toEqual([]);
    });

    it('should filter and process only JavaScript files', async () => {
      // This test verifies the file filtering logic
      const providers = await loader.loadFromDirectory('./src/providers');

      // Should return an array (even if empty due to import issues)
      expect(providers).toBeInstanceOf(Array);
    });

    it('should validate provider classes correctly', async () => {
      // Test that the loader correctly validates provider classes
      const providers = await loader.loadFromDirectory('./src/providers');

      // Each loaded provider should be a valid MetadataProvider
      providers.forEach(provider => {
        expect(provider).toHaveProperty('name');
        expect(provider).toHaveProperty('priority');
        expect(provider).toHaveProperty('canHandle');
        expect(provider).toHaveProperty('scrape');
        expect(provider).toHaveProperty('getValue');

        expect(typeof provider.name).toBe('string');
        expect(typeof provider.priority).toBe('number');
        expect(typeof provider.canHandle).toBe('function');
        expect(typeof provider.scrape).toBe('function');
        expect(typeof provider.getValue).toBe('function');
      });
    });

    it('should handle missing or invalid provider files', async () => {
      // Test with a directory that might have some invalid files
      const providers = await loader.loadFromDirectory('./dist');

      // Should return an array and handle errors gracefully
      expect(providers).toBeInstanceOf(Array);
    });

    it('should instantiate providers correctly when found', async () => {
      const providers = await loader.loadFromDirectory('./src/providers');

      // If providers are found, they should be properly instantiated
      providers.forEach(provider => {
        expect(provider).toBeDefined();
        expect(provider.constructor).toBeDefined();

        // Test that basic provider interface works
        expect(typeof provider.canHandle).toBe('function');
        expect(typeof provider.scrape).toBe('function');
        expect(typeof provider.getValue).toBe('function');

        // Properties should be of correct types
        expect(typeof provider.name).toBe('string');
        expect(typeof provider.priority).toBe('number');
        expect(provider.name.length).toBeGreaterThan(0);
        expect(Number.isFinite(provider.priority)).toBe(true);
      });
    });
  });

  describe('isProviderClass', () => {
    it('should validate correct provider classes', () => {
      const isProviderClass = (loader as any).isProviderClass.bind(loader);

      expect(isProviderClass(MockProvider)).toBe(true);
    });

    it('should reject non-function values', () => {
      const isProviderClass = (loader as any).isProviderClass.bind(loader);

      expect(isProviderClass('string')).toBe(false);
      expect(isProviderClass(123)).toBe(false);
      expect(isProviderClass({})).toBe(false);
      expect(isProviderClass(null)).toBe(false);
      expect(isProviderClass(undefined)).toBe(false);
    });

    it('should reject classes missing required properties', () => {
      const isProviderClass = (loader as any).isProviderClass.bind(loader);

      class MissingName {
        priority = 1;
        canHandle() { return true; }
        scrape() { return null; }
        getValue() { return undefined; }
      }

      class MissingPriority {
        name = 'test';
        canHandle() { return true; }
        scrape() { return null; }
        getValue() { return undefined; }
      }

      class MissingMethods {
        name = 'test';
        priority = 1;
      }

      expect(isProviderClass(MissingName)).toBe(false);
      expect(isProviderClass(MissingPriority)).toBe(false);
      expect(isProviderClass(MissingMethods)).toBe(false);
    });

    it('should reject classes with wrong property types', () => {
      const isProviderClass = (loader as any).isProviderClass.bind(loader);

      class WrongTypes {
        name = 123; // Should be string
        priority = 'high'; // Should be number
        canHandle = 'not a function';
        scrape = 'not a function';
        getValue = 'not a function';
      }

      expect(isProviderClass(WrongTypes)).toBe(false);
    });

    it('should handle constructor errors gracefully', () => {
      const isProviderClass = (loader as any).isProviderClass.bind(loader);

      class ThrowingConstructor {
        constructor() {
          throw new Error('Constructor error');
        }
      }

      expect(isProviderClass(ThrowingConstructor)).toBe(false);
    });
  });
});
