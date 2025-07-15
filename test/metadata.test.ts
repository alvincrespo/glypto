import { describe, it, expect, beforeEach } from 'vitest';
import { Metadata } from '../src/metadata.js';
import { ProviderRegistry } from '../src/provider-registry.js';
import { StandardMetaProvider } from '../src/providers/standard-meta-provider.js';

describe('Metadata', () => {
  let metadata: Metadata;
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
    registry.registerProvider(new StandardMetaProvider());
    metadata = new Metadata(registry);
  });

  describe('addData', () => {
    it('should add data to provider', () => {
      metadata.addData('meta', 'title', 'Test Title');

      expect(metadata.meta.get('title')).toEqual(['Test Title']);
    });

    it('should append to existing data', () => {
      metadata.addData('meta', 'title', 'First Title');
      metadata.addData('meta', 'title', 'Second Title');

      expect(metadata.meta.get('title')).toEqual([
        'First Title',
        'Second Title',
      ]);
    });

    it('should create new provider data if not exists', () => {
      metadata.addData('newProvider', 'key', 'value');

      expect(metadata['providerData']['newProvider']).toBeDefined();
      expect(metadata['providerData']['newProvider'].get('key')).toEqual([
        'value',
      ]);
    });
  });

  describe('getters', () => {
    it('should return favicon with fallback', () => {
      expect(metadata.favicon).toBe('/favicon.ico');

      metadata.addData('meta', 'icon', 'custom-icon.png');
      expect(metadata.favicon).toBe('custom-icon.png');
    });

    it('should return undefined for missing values', () => {
      expect(metadata.title).toBeUndefined();
      expect(metadata.description).toBeUndefined();
      expect(metadata.image).toBeUndefined();
      expect(metadata.url).toBeUndefined();
      expect(metadata.siteName).toBeUndefined();
    });
  });

  describe('legacy getters', () => {
    it('should return empty maps for missing providers', () => {
      expect(metadata.openGraph).toEqual(new Map());
      expect(metadata.twitterCard).toEqual(new Map());
      expect(metadata.meta).toEqual(new Map());
      expect(metadata.other).toEqual(new Map());
    });
  });

  describe('feeds', () => {
    it('should initialize with empty feeds array', () => {
      expect(metadata.feeds).toEqual([]);
    });

    it('should allow adding feeds', () => {
      metadata.feeds.push({
        title: 'RSS Feed',
        type: 'application/rss+xml',
        href: '/feed.xml',
      });

      expect(metadata.feeds).toHaveLength(1);
      expect(metadata.feeds[0].title).toBe('RSS Feed');
    });
  });
});
