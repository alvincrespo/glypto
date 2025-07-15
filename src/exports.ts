// Core interfaces and types
export { MetadataProvider, ProviderData, Feed } from './types.js';

// Main classes
export { Metadata } from './metadata.js';
export { Scraper } from './scraper.js';
export { ProviderRegistry } from './provider-registry.js';
export { ProviderLoader } from './provider-loader.js';

// Factory functions for easy usage
export {
  createScraper,
  createScraperWithProviders,
  scrapeMetadata,
} from './factory.js';

// Built-in providers
export { OpenGraphProvider } from './providers/open-graph-provider.js';
export { TwitterProvider } from './providers/twitter-provider.js';
export { StandardMetaProvider } from './providers/standard-meta-provider.js';
export { OtherElementsProvider } from './providers/other-elements-provider.js';

// Example provider (for extending the system)
export { JsonLdProvider } from './providers/json-ld-provider.js';
