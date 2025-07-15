import { MetadataProvider } from './types.js';
import { readdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export class ProviderLoader {
  async loadFromDirectory(providersPath?: string): Promise<MetadataProvider[]> {
    const providers: MetadataProvider[] = [];

    try {
      const providersDir = providersPath || join(__dirname, 'providers');
      const files = await readdir(providersDir);

      const providerFiles = files.filter(file =>
        file.endsWith('.js') && !file.endsWith('.d.ts')
      );

      for (const file of providerFiles) {
        try {
          const modulePath = `./providers/${file}`;
          const module = await import(modulePath);

          // Look for exported classes that implement MetadataProvider
          for (const exportName of Object.keys(module)) {
            const ExportedClass = module[exportName];

            if (this.isProviderClass(ExportedClass)) {
              const instance = new ExportedClass();
              providers.push(instance);
            }
          }
        } catch (error) {
          console.warn(`Failed to load provider from ${file}:`, error);
        }
      }
    } catch (error) {
      console.warn('Failed to load providers from directory:', error);
      // Return empty array, let caller decide fallback strategy
    }

    return providers;
  }

  async loadDefaults(): Promise<MetadataProvider[]> {
    const providers: MetadataProvider[] = [];

    try {
      const { OpenGraphProvider } = await import('./providers/open-graph-provider.js');
      const { TwitterProvider } = await import('./providers/twitter-provider.js');
      const { StandardMetaProvider } = await import('./providers/standard-meta-provider.js');
      const { OtherElementsProvider } = await import('./providers/other-elements-provider.js');

      providers.push(
        new OpenGraphProvider(),
        new TwitterProvider(),
        new StandardMetaProvider(),
        new OtherElementsProvider()
      );
    } catch (error) {
      console.error('Failed to load default providers:', error);
    }

    return providers;
  }

  private isProviderClass(cls: unknown): cls is new () => MetadataProvider {
    if (typeof cls !== 'function') return false;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instance = new (cls as new () => any)();
      return (
        typeof instance.name === 'string' &&
        typeof instance.priority === 'number' &&
        typeof instance.canHandle === 'function' &&
        typeof instance.scrape === 'function' &&
        typeof instance.getValue === 'function'
      );
    } catch {
      return false;
    }
  }
}
