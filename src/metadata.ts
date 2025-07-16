import { Feed, ProviderData } from './types.js';
import { ProviderRegistry } from './provider-registry.js';

export class Metadata {
  private providerData: ProviderData = {};
  private registry: ProviderRegistry;
  feeds: Feed[] = [];

  constructor(registry?: ProviderRegistry) {
    this.registry = registry || new ProviderRegistry();

    // Initialize provider data maps
    for (const provider of this.registry.getProviders()) {
      this.providerData[provider.name] = new Map<string, string[]>();
    }
  }

  // Method to add data from scraping
  addData(providerName: string, key: string, value: string): void {
    if (!this.providerData[providerName]) {
      this.providerData[providerName] = new Map<string, string[]>();
    }

    const data = this.providerData[providerName];
    if (!data.has(key)) {
      data.set(key, []);
    }
    data.get(key)!.push(value);
  }

  // Getter method using provider resolution
  private resolveValue(key: string): string | undefined {
    return this.registry.resolveValue(key, this.providerData);
  }

  get favicon(): string {
    return (
      this.resolveValue('icon') ||
      this.resolveValue('shortcut icon') ||
      '/favicon.ico'
    );
  }

  get title(): string | undefined {
    return this.resolveValue('title') || this.resolveValue('firstHeading');
  }

  get description(): string | undefined {
    return this.resolveValue('description');
  }

  get image(): string | undefined {
    return this.resolveValue('image');
  }

  get url(): string | undefined {
    return this.resolveValue('url');
  }

  get siteName(): string | undefined {
    // Twitter uses 'site' instead of 'site_name'
    return this.resolveValue('site_name') || this.resolveValue('site');
  }

  // Legacy getters for backward compatibility (if needed)
  get openGraph(): Map<string, string[]> {
    return this.providerData['openGraph'] || new Map();
  }

  get twitterCard(): Map<string, string[]> {
    return this.providerData['twitter'] || new Map();
  }

  get meta(): Map<string, string[]> {
    return this.providerData['meta'] || new Map();
  }

  get other(): Map<string, string[]> {
    return this.providerData['other'] || new Map();
  }
}
