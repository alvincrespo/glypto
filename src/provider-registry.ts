import { MetadataProvider, ProviderData } from './types.js';

export class ProviderRegistry {
  private providers: MetadataProvider[] = [];

  constructor(providers: MetadataProvider[] = []) {
    providers.forEach((provider) => this.registerProvider(provider));
  }

  registerProvider(provider: MetadataProvider): void {
    this.providers.push(provider);
    // Keep providers sorted by priority
    this.providers.sort((a, b) => a.priority - b.priority);
  }

  getProviders(): MetadataProvider[] {
    return [...this.providers];
  }

  getProvider(name: string): MetadataProvider | undefined {
    return this.providers.find((p) => p.name === name);
  }

  scrapeFromElement(element: Element): {
    provider: MetadataProvider;
    data: { key: string; value: string };
  } | null {
    for (const provider of this.providers) {
      if (provider.canHandle(element)) {
        const data = provider.scrape(element);
        if (data) {
          return { provider, data };
        }
      }
    }
    return null;
  }

  resolveValue(key: string, providerData: ProviderData): string | undefined {
    for (const provider of this.providers) {
      const data = providerData[provider.name];
      if (data) {
        const value = provider.getValue(key, data);
        if (value) {
          return value;
        }
      }
    }
    return undefined;
  }
}
