import { Scraper } from './scraper.js';
import { ProviderRegistry } from './provider-registry.js';
import { ProviderLoader } from './provider-loader.js';
import { MetadataProvider } from './types.js';
import { Metadata } from './metadata.js';

/**
 * Factory function to create a fully initialized Scraper
 */
export async function createScraper(): Promise<Scraper> {
  const loader = new ProviderLoader();

  // Try to load from directory first, fallback to defaults
  let providers = await loader.loadFromDirectory();
  if (providers.length === 0) {
    providers = await loader.loadDefaults();
  }

  const registry = new ProviderRegistry(providers);
  return new Scraper(registry);
}

/**
 * Create a scraper with custom providers
 */
export function createScraperWithProviders(providers: MetadataProvider[]): Scraper {
  const registry = new ProviderRegistry(providers);
  return new Scraper(registry);
}

/**
 * Convenience function to scrape metadata from a document
 */
export async function scrapeMetadata(document: Document): Promise<Metadata> {
  const scraper = await createScraper();
  return scraper.scrape(document);
}
