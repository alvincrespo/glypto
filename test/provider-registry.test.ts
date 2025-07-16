import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { ProviderRegistry } from '../src/provider-registry.js';
import { OpenGraphProvider } from '../src/providers/open-graph-provider.js';
import { TwitterProvider } from '../src/providers/twitter-provider.js';
import { StandardMetaProvider } from '../src/providers/standard-meta-provider.js';
import { MetadataProvider } from '../src/types.js';

// Mock provider for testing
class MockProvider implements MetadataProvider {
  readonly name: string;
  readonly priority: number;

  constructor(name: string, priority: number) {
    this.name = name;
    this.priority = priority;
  }

  canHandle(element: Element): boolean {
    return element.getAttribute('mock-provider') === this.name;
  }

  scrape(element: Element): { key: string; value: string } | null {
    const key = element.getAttribute('mock-key');
    const value = element.getAttribute('mock-value');
    if (key && value) {
      return { key, value };
    }
    return null;
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;
  let document: Document;

  beforeEach(() => {
    registry = new ProviderRegistry();
    const dom = new JSDOM();
    document = dom.window.document;
  });

  describe('constructor', () => {
    it('should create empty registry', () => {
      expect(registry.getProviders()).toEqual([]);
    });

    it('should initialize with providers and sort by priority', () => {
      const provider1 = new MockProvider('provider1', 3);
      const provider2 = new MockProvider('provider2', 1);
      const provider3 = new MockProvider('provider3', 2);

      const registryWithProviders = new ProviderRegistry([
        provider1,
        provider2,
        provider3,
      ]);
      const providers = registryWithProviders.getProviders();

      expect(providers).toHaveLength(3);
      expect(providers[0].priority).toBe(1);
      expect(providers[1].priority).toBe(2);
      expect(providers[2].priority).toBe(3);
    });
  });

  describe('registerProvider', () => {
    it('should register a single provider', () => {
      const provider = new OpenGraphProvider();

      registry.registerProvider(provider);

      expect(registry.getProviders()).toHaveLength(1);
      expect(registry.getProviders()[0]).toBe(provider);
    });

    it('should register multiple providers and sort by priority', () => {
      const ogProvider = new OpenGraphProvider(); // priority 1
      const twitterProvider = new TwitterProvider(); // priority 2
      const metaProvider = new StandardMetaProvider(); // priority 3

      registry.registerProvider(metaProvider);
      registry.registerProvider(ogProvider);
      registry.registerProvider(twitterProvider);

      const providers = registry.getProviders();
      expect(providers).toHaveLength(3);
      expect(providers[0]).toBe(ogProvider); // priority 1
      expect(providers[1]).toBe(twitterProvider); // priority 2
      expect(providers[2]).toBe(metaProvider); // priority 3
    });

    it('should maintain order for providers with same priority', () => {
      const provider1 = new MockProvider('first', 1);
      const provider2 = new MockProvider('second', 1);

      registry.registerProvider(provider1);
      registry.registerProvider(provider2);

      const providers = registry.getProviders();
      expect(providers[0]).toBe(provider1);
      expect(providers[1]).toBe(provider2);
    });
  });

  describe('getProviders', () => {
    it('should return copy of providers array', () => {
      const provider = new OpenGraphProvider();
      registry.registerProvider(provider);

      const providers1 = registry.getProviders();
      const providers2 = registry.getProviders();

      expect(providers1).toEqual(providers2);
      expect(providers1).not.toBe(providers2); // Different array instances
    });
  });

  describe('getProvider', () => {
    it('should find provider by name', () => {
      const ogProvider = new OpenGraphProvider();
      const twitterProvider = new TwitterProvider();

      registry.registerProvider(ogProvider);
      registry.registerProvider(twitterProvider);

      expect(registry.getProvider('openGraph')).toBe(ogProvider);
      expect(registry.getProvider('twitter')).toBe(twitterProvider);
    });

    it('should return undefined for non-existent provider', () => {
      registry.registerProvider(new OpenGraphProvider());

      expect(registry.getProvider('nonexistent')).toBeUndefined();
    });

    it('should return undefined for empty registry', () => {
      expect(registry.getProvider('openGraph')).toBeUndefined();
    });
  });

  describe('scrapeFromElement', () => {
    beforeEach(() => {
      const ogProvider = new OpenGraphProvider();
      const twitterProvider = new TwitterProvider();
      registry.registerProvider(ogProvider);
      registry.registerProvider(twitterProvider);
    });

    it('should return data from first matching provider', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      element.setAttribute('content', 'Test Title');

      const result = registry.scrapeFromElement(element);

      expect(result).not.toBeNull();
      expect(result?.provider.name).toBe('openGraph');
      expect(result?.data).toEqual({ key: 'title', value: 'Test Title' });
    });

    it('should try providers in priority order', () => {
      // Create element that could match multiple providers
      const mockProvider1 = new MockProvider('mock1', 0.5); // Higher priority
      const mockProvider2 = new MockProvider('mock2', 1); // Lower priority

      // Make both providers able to handle the element
      const element = document.createElement('div');
      element.setAttribute('mock-provider', 'mock1');
      element.setAttribute('mock-key', 'test');
      element.setAttribute('mock-value', 'value1');

      registry.registerProvider(mockProvider2);
      registry.registerProvider(mockProvider1);

      const result = registry.scrapeFromElement(element);

      expect(result?.provider.name).toBe('mock1'); // Higher priority provider
    });

    it('should return null when no provider can handle element', () => {
      const element = document.createElement('div');

      const result = registry.scrapeFromElement(element);

      expect(result).toBeNull();
    });

    it('should return null when provider returns null', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      // Missing content attribute

      const result = registry.scrapeFromElement(element);

      expect(result).toBeNull();
    });

    it('should skip provider that cannot handle element', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:card');
      element.setAttribute('content', 'summary');

      const result = registry.scrapeFromElement(element);

      expect(result?.provider.name).toBe('twitter');
      expect(result?.data).toEqual({ key: 'card', value: 'summary' });
    });
  });

  describe('resolveValue', () => {
    beforeEach(() => {
      const ogProvider = new OpenGraphProvider();
      const twitterProvider = new TwitterProvider();
      const metaProvider = new StandardMetaProvider();

      registry.registerProvider(ogProvider);
      registry.registerProvider(twitterProvider);
      registry.registerProvider(metaProvider);
    });

    it('should resolve value from first provider that has it', () => {
      const providerData = {
        openGraph: new Map([['title', ['OG Title']]]),
        twitter: new Map([['title', ['Twitter Title']]]),
        meta: new Map([['title', ['Meta Title']]]),
      };

      const result = registry.resolveValue('title', providerData);

      expect(result).toBe('OG Title'); // OpenGraph has highest priority
    });

    it('should fall back to lower priority providers', () => {
      const providerData = {
        openGraph: new Map(), // No title
        twitter: new Map([['title', ['Twitter Title']]]),
        meta: new Map([['title', ['Meta Title']]]),
      };

      const result = registry.resolveValue('title', providerData);

      expect(result).toBe('Twitter Title');
    });

    it('should return undefined when no provider has the value', () => {
      const providerData = {
        openGraph: new Map(),
        twitter: new Map(),
        meta: new Map(),
      };

      const result = registry.resolveValue('title', providerData);

      expect(result).toBeUndefined();
    });

    it('should handle missing provider data gracefully', () => {
      const providerData = {
        openGraph: new Map([['title', ['OG Title']]]),
        // Missing twitter and meta
      };

      const result = registry.resolveValue('title', providerData);

      expect(result).toBe('OG Title');
    });

    it('should skip providers that return undefined', () => {
      const providerData = {
        openGraph: new Map([['description', ['OG Description']]]), // Has description but not title
        twitter: new Map([['title', ['Twitter Title']]]),
        meta: new Map([['title', ['Meta Title']]]),
      };

      const result = registry.resolveValue('title', providerData);

      expect(result).toBe('Twitter Title');
    });

    it('should handle empty provider data', () => {
      const result = registry.resolveValue('title', {});

      expect(result).toBeUndefined();
    });
  });
});
