import { MetadataProvider } from '../types.js';

export class OtherElementsProvider implements MetadataProvider {
  readonly name = 'other';
  readonly priority = 4;

  canHandle(element: Element): boolean {
    // This provider handles title tags, h1 tags, and link tags
    const tagName = element.tagName?.toLowerCase();
    return (
      tagName === 'title' ||
      tagName === 'h1' ||
      (tagName === 'link' && !!element.getAttribute('rel'))
    );
  }

  scrape(element: Element): { key: string; value: string } | null {
    const tagName = element.tagName?.toLowerCase();

    if (tagName === 'title' && element.textContent) {
      return { key: 'title', value: element.textContent.trim() };
    }

    if (tagName === 'h1' && element.textContent) {
      return { key: 'firstHeading', value: element.textContent.trim() };
    }

    if (tagName === 'link') {
      const rel = element.getAttribute('rel');
      const href = element.getAttribute('href');

      if (rel && href) {
        if (rel === 'icon') {
          return { key: 'icon', value: href };
        }
        if (rel === 'shortcut icon') {
          return { key: 'shortcut icon', value: href };
        }
      }
    }

    return null;
  }

  getValue(key: string, data: Map<string, string[]>): string | undefined {
    const values = data.get(key);
    return values && values.length > 0 ? values[0] : undefined;
  }
}
