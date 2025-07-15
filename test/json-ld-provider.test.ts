import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { JsonLdProvider } from '../src/providers/json-ld-provider.js';

describe('JsonLdProvider', () => {
  let provider: JsonLdProvider;
  let document: Document;

  beforeEach(() => {
    provider = new JsonLdProvider();
    const dom = new JSDOM();
    document = dom.window.document;
  });

  it('should have correct name and priority', () => {
    expect(provider.name).toBe('jsonLd');
    expect(provider.priority).toBe(0.5);
  });

  describe('canHandle', () => {
    it('should handle script elements with application/ld+json type', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      
      expect(provider.canHandle(element)).toBe(true);
    });

    it('should not handle script elements with other types', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'text/javascript');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle script elements without type', () => {
      const element = document.createElement('script');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle other elements', () => {
      const element = document.createElement('div');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should handle elements case-insensitively', () => {
      // Create element with uppercase tag name
      const element = document.createElementNS('http://www.w3.org/1999/xhtml', 'SCRIPT');
      element.setAttribute('type', 'application/ld+json');
      
      expect(provider.canHandle(element)).toBe(true);
    });
  });

  describe('scrape', () => {
    it('should parse JSON-LD Article and extract headline as title', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'headline': 'Example Article Title'
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'title', value: 'Example Article Title' });
    });

    it('should parse JSON-LD WebPage and extract headline as title', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'WebPage',
        'headline': 'Example Page Title'
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'title', value: 'Example Page Title' });
    });

    it('should parse JSON-LD and extract description', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'description': 'Example article description'
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'description', value: 'Example article description' });
    });

    it('should parse JSON-LD and extract image URL', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'image': {
          'url': 'https://example.com/image.jpg'
        }
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'image', value: 'https://example.com/image.jpg' });
    });

    it('should prioritize headline over description and image', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'headline': 'Article Title',
        'description': 'Article Description',
        'image': { 'url': 'https://example.com/image.jpg' }
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'title', value: 'Article Title' });
    });

    it('should prioritize description over image when no headline', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'description': 'Article Description',
        'image': { 'url': 'https://example.com/image.jpg' }
      });
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'description', value: 'Article Description' });
    });

    it('should return null for unsupported @type', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Organization',
        'name': 'Example Company'
      });
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null for JSON without extractable fields', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = JSON.stringify({
        '@type': 'Article',
        'author': 'John Doe'
      });
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null for invalid JSON', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = 'invalid json';
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null for empty content', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = '';
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null for null textContent', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = null;
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should handle malformed JSON gracefully', () => {
      const element = document.createElement('script');
      element.setAttribute('type', 'application/ld+json');
      element.textContent = '{"@type": "Article", "headline":}';
      
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