import { MetadataProvider } from '../types.js';

export class TwitterProvider implements MetadataProvider {
  readonly name = 'twitter';
  readonly priority = 2;

  canHandle(element: Element): boolean {
    const property = element.getAttribute('property');
    const name = element.getAttribute('name');
    return (
      (property?.startsWith('twitter:') || name?.startsWith('twitter:')) ??
      false
    );
  }

  scrape(element: Element): { key: string; value: string } | null {
    const property =
      element.getAttribute('property') || element.getAttribute('name');
    const content = element.getAttribute('content');

    if (!property || !content || !this.canHandle(element)) {
      return null;
    }

    const key = property.slice(8); // Remove 'twitter:' prefix
    return { key, value: content };
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}
