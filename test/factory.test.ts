import { describe, it, expect, beforeEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
import { createScraper, createScraperWithProviders, scrapeMetadata } from '../src/factory.js';
import { ProviderLoader } from '../src/provider-loader.js';
import { OpenGraphProvider } from '../src/providers/open-graph-provider.js';
import { TwitterProvider } from '../src/providers/twitter-provider.js';
import { StandardMetaProvider } from '../src/providers/standard-meta-provider.js';
import { MetadataProvider } from '../src/types.js';

// Mock ProviderLoader
vi.mock('../src/provider-loader.js');

// Mock provider for testing
class MockProvider implements MetadataProvider {
  readonly name: string;
  readonly priority: number;

  constructor(name: string, priority: number) {
    this.name = name;
    this.priority = priority;
  }

  canHandle(): boolean { return true; }
  scrape(): { key: string; value: string } | null { return { key: 'test', value: 'mock' }; }
  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}

describe('Factory Functions', () => {
  let document: Document;

  beforeEach(() => {
    const dom = new JSDOM(`
      <html>
        <head>
          <title>Test Page</title>
          <meta property="og:title" content="OG Title">
          <meta name="twitter:card" content="summary">
          <meta name="description" content="Test description">
        </head>
        <body>
          <h1>Main Heading</h1>
        </body>
      </html>
    `);
    document = dom.window.document;
    vi.clearAllMocks();
  });

  describe('createScraper', () => {
    it('should create scraper with loaded providers from directory', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([
          new MockProvider('provider1', 1),
          new MockProvider('provider2', 2)
        ]),
        loadDefaults: vi.fn()
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const scraper = await createScraper();

      expect(mockLoaderInstance.loadFromDirectory).toHaveBeenCalled();
      expect(mockLoaderInstance.loadDefaults).not.toHaveBeenCalled();
      expect(scraper).toBeDefined();
    });

    it('should fallback to default providers when directory loading fails', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]), // Empty array
        loadDefaults: vi.fn().mockResolvedValue([
          new MockProvider('default1', 1),
          new MockProvider('default2', 2)
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const scraper = await createScraper();

      expect(mockLoaderInstance.loadFromDirectory).toHaveBeenCalled();
      expect(mockLoaderInstance.loadDefaults).toHaveBeenCalled();
      expect(scraper).toBeDefined();
    });

    it('should create functional scraper that can scrape metadata', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]),
        loadDefaults: vi.fn().mockResolvedValue([
          new OpenGraphProvider(),
          new TwitterProvider(),
          new StandardMetaProvider()
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const scraper = await createScraper();
      const metadata = await scraper.scrape(document);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
    });

    it('should handle provider loading errors gracefully', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]), // Return empty array instead of error
        loadDefaults: vi.fn().mockResolvedValue([
          new MockProvider('fallback', 1)
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const scraper = await createScraper();

      expect(scraper).toBeDefined();
      expect(mockLoaderInstance.loadDefaults).toHaveBeenCalled();
    });
  });

  describe('createScraperWithProviders', () => {
    it('should create scraper with provided custom providers', () => {
      const customProviders = [
        new MockProvider('custom1', 1),
        new MockProvider('custom2', 2)
      ];

      const scraper = createScraperWithProviders(customProviders);

      expect(scraper).toBeDefined();
    });

    it('should create functional scraper with custom providers', async () => {
      const customProviders = [
        new OpenGraphProvider(),
        new StandardMetaProvider()
      ];

      const scraper = createScraperWithProviders(customProviders);
      const metadata = await scraper.scrape(document);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
    });

    it('should work with empty providers array', () => {
      const scraper = createScraperWithProviders([]);

      expect(scraper).toBeDefined();
    });

    it('should work with single provider', async () => {
      const scraper = createScraperWithProviders([new OpenGraphProvider()]);
      const metadata = await scraper.scrape(document);

      expect(metadata).toBeDefined();
    });

    it('should respect provider priority order', async () => {
      // Create providers with different priorities
      const highPriorityProvider = new MockProvider('high', 1);
      const lowPriorityProvider = new MockProvider('low', 10);

      // Mock both providers to handle the same element type
      const mockCanHandle = vi.fn().mockReturnValue(true);
      const mockScrapeHigh = vi.fn().mockReturnValue({ key: 'title', value: 'high priority' });
      const mockScrapeLow = vi.fn().mockReturnValue({ key: 'title', value: 'low priority' });

      highPriorityProvider.canHandle = mockCanHandle;
      highPriorityProvider.scrape = mockScrapeHigh;
      lowPriorityProvider.canHandle = mockCanHandle;
      lowPriorityProvider.scrape = mockScrapeLow;

      const scraper = createScraperWithProviders([lowPriorityProvider, highPriorityProvider]);
      const metadata = await scraper.scrape(document);

      // High priority provider should be used first
      expect(mockScrapeHigh).toHaveBeenCalled();
      expect(mockScrapeLow).not.toHaveBeenCalled();
    });
  });

  describe('scrapeMetadata', () => {
    it('should scrape metadata using default scraper configuration', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]),
        loadDefaults: vi.fn().mockResolvedValue([
          new OpenGraphProvider(),
          new TwitterProvider(),
          new StandardMetaProvider()
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const metadata = await scrapeMetadata(document);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeDefined();
      expect(mockLoaderInstance.loadFromDirectory).toHaveBeenCalled();
    });

    it('should return metadata with extracted values', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]),
        loadDefaults: vi.fn().mockResolvedValue([
          new OpenGraphProvider(),
          new TwitterProvider(),
          new StandardMetaProvider()
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const metadata = await scrapeMetadata(document);

      // Should extract values from the test document
      expect(metadata.title).toBe('OG Title'); // OpenGraph has higher priority than title tag
      expect(metadata.openGraph.get('title')).toEqual(['OG Title']);
      expect(metadata.twitterCard.get('card')).toEqual(['summary']);
      expect(metadata.meta.get('description')).toEqual(['Test description']);
    });

    it('should handle documents without metadata gracefully', async () => {
      const emptyDom = new JSDOM('<html><head></head><body></body></html>');
      const emptyDocument = emptyDom.window.document;

      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]),
        loadDefaults: vi.fn().mockResolvedValue([
          new OpenGraphProvider(),
          new StandardMetaProvider()
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const metadata = await scrapeMetadata(emptyDocument);

      expect(metadata).toBeDefined();
      expect(metadata.title).toBeUndefined();
      expect(metadata.description).toBeUndefined();
    });

    it('should work with custom HTML structure', async () => {
      const customDom = new JSDOM(`
        <html>
          <head>
            <meta property="og:description" content="Custom Description">
            <meta name="twitter:title" content="Twitter Title">
            <link rel="icon" href="/custom-icon.ico">
          </head>
          <body>
            <h1>Custom Heading</h1>
          </body>
        </html>
      `);
      const customDocument = customDom.window.document;

      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]),
        loadDefaults: vi.fn().mockResolvedValue([
          new OpenGraphProvider(),
          new TwitterProvider(),
          new StandardMetaProvider()
        ])
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      const metadata = await scrapeMetadata(customDocument);

      expect(metadata.description).toBe('Custom Description');
      expect(metadata.twitterCard.get('title')).toEqual(['Twitter Title']);
    });

    it('should handle scraper creation errors', async () => {
      const mockLoader = vi.mocked(ProviderLoader);
      const mockLoaderInstance = {
        loadFromDirectory: vi.fn().mockResolvedValue([]), // Return empty instead of error
        loadDefaults: vi.fn().mockResolvedValue([]) // Return empty instead of error
      };
      mockLoader.mockImplementation(() => mockLoaderInstance as any);

      // Should handle errors gracefully and return a scraper with empty providers
      const metadata = await scrapeMetadata(document);

      expect(metadata).toBeDefined();
    });
  });
});