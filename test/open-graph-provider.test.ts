import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { OpenGraphProvider } from '../src/providers/open-graph-provider.js';

describe('OpenGraphProvider', () => {
  let provider: OpenGraphProvider;
  let document: Document;

  beforeEach(() => {
    provider = new OpenGraphProvider();
    const dom = new JSDOM();
    document = dom.window.document;
  });

  it('should have correct name and priority', () => {
    expect(provider.name).toBe('openGraph');
    expect(provider.priority).toBe(1);
  });

  describe('canHandle', () => {
    it('should handle og: property attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');

      expect(provider.canHandle(element)).toBe(true);
    });

    it('should handle og: name attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'og:description');

      expect(provider.canHandle(element)).toBe(true);
    });

    it('should not handle non-og properties', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'twitter:title');

      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle elements without og attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');

      expect(provider.canHandle(element)).toBe(false);
    });

    it('should handle null attributes gracefully', () => {
      const element = document.createElement('meta');

      expect(provider.canHandle(element)).toBe(false);
    });
  });

  describe('scrape', () => {
    it('should scrape og:title from property attribute', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      element.setAttribute('content', 'Test Title');

      const result = provider.scrape(element);

      expect(result).toEqual({ key: 'title', value: 'Test Title' });
    });

    it('should scrape og:description from name attribute', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'og:description');
      element.setAttribute('content', 'Test Description');

      const result = provider.scrape(element);

      expect(result).toEqual({ key: 'description', value: 'Test Description' });
    });

    it('should return null for elements it cannot handle', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      element.setAttribute('content', 'Test');

      const result = provider.scrape(element);

      expect(result).toBeNull();
    });

    it('should return null when missing content', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');

      const result = provider.scrape(element);

      expect(result).toBeNull();
    });

    it('should return null when missing property/name', () => {
      const element = document.createElement('meta');
      element.setAttribute('content', 'Test');

      const result = provider.scrape(element);

      expect(result).toBeNull();
    });
  });

  describe('getValue', () => {
    it('should return first value from array', () => {
      const data = new Map([['title', ['First Title', 'Second Title']]]);

      const result = provider.getValue('title', data);

      expect(result).toBe('First Title');
    });

    it('should return undefined for missing key', () => {
      const data = new Map([['title', ['Test Title']]]);

      const result = provider.getValue('description', data);

      expect(result).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const data = new Map([['title', []]]);

      const result = provider.getValue('title', data);

      expect(result).toBeUndefined();
    });
  });
});
