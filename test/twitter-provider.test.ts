import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { TwitterProvider } from '../src/providers/twitter-provider.js';

describe('TwitterProvider', () => {
  let provider: TwitterProvider;
  let document: Document;

  beforeEach(() => {
    provider = new TwitterProvider();
    const dom = new JSDOM();
    document = dom.window.document;
  });

  it('should have correct name and priority', () => {
    expect(provider.name).toBe('twitter');
    expect(provider.priority).toBe(2);
  });

  describe('canHandle', () => {
    it('should handle twitter: property attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'twitter:title');
      
      expect(provider.canHandle(element)).toBe(true);
    });

    it('should handle twitter: name attributes', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:card');
      
      expect(provider.canHandle(element)).toBe(true);
    });

    it('should not handle non-twitter properties', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'og:title');
      
      expect(provider.canHandle(element)).toBe(false);
    });

    it('should not handle elements without twitter attributes', () => {
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
    it('should scrape twitter:card and remove prefix', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:card');
      element.setAttribute('content', 'summary');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'card', value: 'summary' });
    });

    it('should scrape twitter:site and remove prefix', () => {
      const element = document.createElement('meta');
      element.setAttribute('name', 'twitter:site');
      element.setAttribute('content', '@example');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'site', value: '@example' });
    });

    it('should scrape twitter:title from property attribute', () => {
      const element = document.createElement('meta');
      element.setAttribute('property', 'twitter:title');
      element.setAttribute('content', 'Twitter Title');
      
      const result = provider.scrape(element);
      
      expect(result).toEqual({ key: 'title', value: 'Twitter Title' });
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
      element.setAttribute('name', 'twitter:card');
      
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
      const data = new Map([['card', ['summary', 'summary_large_image']]]);
      
      const result = provider.getValue('card', data);
      
      expect(result).toBe('summary');
    });

    it('should return undefined for missing key', () => {
      const data = new Map([['card', ['summary']]]);
      
      const result = provider.getValue('site', data);
      
      expect(result).toBeUndefined();
    });

    it('should return undefined for empty array', () => {
      const data = new Map([['card', []]]);
      
      const result = provider.getValue('card', data);
      
      expect(result).toBeUndefined();
    });
  });
});