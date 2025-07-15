import { MetadataProvider } from '../types.js';

/**
 * Example of how to add a new provider - JSON-LD structured data
 * This shows how easy it is to extend the system with new metadata sources
 */
export class JsonLdProvider implements MetadataProvider {
  readonly name = 'jsonLd';
  readonly priority = 0.5; // Even higher priority than OpenGraph

  canHandle(element: Element): boolean {
    return (
      element.tagName?.toLowerCase() === 'script' &&
      element.getAttribute('type') === 'application/ld+json'
    );
  }

  scrape(element: Element): { key: string; value: string } | null {
    try {
      const content = element.textContent;
      if (!content) return null;

      const jsonData = JSON.parse(content);

      // Scrape common fields from JSON-LD
      if (jsonData['@type'] === 'Article' || jsonData['@type'] === 'WebPage') {
        if (jsonData.headline) {
          return { key: 'title', value: jsonData.headline };
        }
        if (jsonData.description) {
          return { key: 'description', value: jsonData.description };
        }
        if (jsonData.image && jsonData.image.url) {
          return { key: 'image', value: jsonData.image.url };
        }
      }
    } catch {
      // Invalid JSON, ignore
    }

    return null;
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}
