import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { StandardMetaProvider } from '../src/providers/standard-meta-provider.js';

describe('StandardMetaProvider', () => {
  let provider: StandardMetaProvider;
  let document: Document;

  beforeEach(() => {
    provider = new StandardMetaProvider();
    const dom = new JSDOM();
    document = dom.window.document;
  });

  it('should have correct name and priority', () => {
    expect(provider.name).toBe('meta');
    expect(provider.priority).toBe(3);
  });

  describe('canHandle', () => {
    it('should handle standard meta tags with name and content', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      element.setAttribute('content', 'Test description');
      
      expect(provider.canHandle(element)).toBe(true);
    });

    it('should handle meta tags with property and content', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'custom');
      element.setAttribute('content', 'Test content');
      
      expect(provider.canHandle(element)).toBe(true);
    });

    it('should not handle og: properties', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      element.setAttribute('content', 'Test');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle twitter: properties', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:card');
      element.setAttribute('content', 'summary');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle og: name attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'og:description');
      element.setAttribute('content', 'Test');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle twitter: property attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'twitter:title');
      element.setAttribute('content', 'Test');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle elements without content', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle elements without name or property', () => {
      const element = document.createElement('meta');
      element.setAttribute('content', 'Test content');
      
      expect(provider.canHandle(element)).toBe(false);
    });
  });

  describe('scrape', () => {
    it('should scrape meta tag with name attribute', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'keywords');
      element.setAttribute('content', 'test, example');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'keywords', value: 'test, example' });
    });

    it('should scrape meta tag with property attribute', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'custom');
      element.setAttribute('content', 'custom value');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'custom', value: 'custom value' });
    });

    it('should prefer name over property when both exist', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      element.setAttribute('property', 'other');
      element.setAttribute('content', 'test content');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'description', value: 'test content' });
    });

    it('should return null for elements it cannot handle', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      element.setAttribute('content', 'Test');
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null when missing content', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'description');
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });

    it('should return null when missing name and property', () => {
      const element = document.createElement('meta');
      element.setAttribute('content', 'Test');
      
      const result = provider.scrape(element);
      
      expect(result).toBeNull();
    });
  });

  describe('getValue', () => {
    it('should return first value from array', () => {
      const data = new Map([['description', ['First Description', 'Second Description']]]);
      
      const result = provider.getValue('description', data);
      
      expect(result).toBe('First Description');
    });

    it('should return undefined for missing key', () => {
      const data = new Map([['description', ['Test Description']]]);
      
      const result = provider.getValue('keywords', data);
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const data = new Map([['description', []]]);
      
      const result = provider.getValue('description', data);
      
      expect(result).toBeUndefined();
    });
  });
});