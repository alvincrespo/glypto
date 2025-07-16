import { MetadataProvider } from '../types.js';

export class StandardMetaProvider implements MetadataProvider {
  readonly name = 'meta';
  readonly priority = 3;

  canHandle(element: Element): boolean {
    const property = element.getAttribute('property');
    const name = element.getAttribute('name');
    const content = element.getAttribute('content');

    // Handle standard meta tags that aren't OpenGraph or Twitter
    return !!(
      content &&
      (name || property) &&
      !name?.startsWith('og:') &&
      !name?.startsWith('twitter:') &&
      !property?.startsWith('og:') &&
      !property?.startsWith('twitter:')
    );
  }

  scrape(element: Element): { key: string; value: string } | null {
    const name =
      element.getAttribute('name') || element.getAttribute('property');
    const content = element.getAttribute('content');

    if (!name || !content || !this.canHandle(element)) {
      return null;
    }

    return { key: name, value: content };
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}
