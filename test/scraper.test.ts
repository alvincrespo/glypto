import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import { Scraper } from '../src/scraper.js';
import { ProviderRegistry } from '../src/provider-registry.js';

describe('Scraper', () => {
  let scraper: Scraper;
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
    scraper = new Scraper(registry);
  });

  describe('scrape', () => {
    it('should throw error for invalid document', async () => {
      await expect(scraper.scrape({} as Document)).rejects.toThrow('DOM Document expected.');
    });

    it('should scrape basic HTML metadata', async () => {
      const html = `
        <html>
          <head>
            <title>Test Page</title>
            <meta name="description" content="Test Description">
            <meta property="og:title" content="OG Title">
            <link rel="icon" href="/favicon.ico">
          </head>
          <body>
            <h1>Main Heading</h1>
          </body>
        </html>
      `;
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const metadata = await scraper.scrape(document);
      
      expect(metadata).toBeDefined();
      expect(metadata.feeds).toEqual([]);
    });

    it('should scrape feed links', async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" title="RSS Feed" href="/feed.xml">
            <link rel="alternate" type="application/atom+xml" title="Atom Feed" href="/atom.xml">
          </head>
        </html>
      `;
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const metadata = await scraper.scrape(document);
      
      expect(metadata.feeds).toHaveLength(2);
      expect(metadata.feeds[0]).toEqual({
        title: 'RSS Feed',
        type: 'application/rss+xml',
        href: '/feed.xml'
      });
      expect(metadata.feeds[1]).toEqual({
        title: 'Atom Feed',
        type: 'application/atom+xml',
        href: '/atom.xml'
      });
    });

    it('should handle feed links without title', async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" href="/feed.xml">
          </head>
        </html>
      `;
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const metadata = await scraper.scrape(document);
      
      expect(metadata.feeds).toHaveLength(1);
      expect(metadata.feeds[0]).toEqual({
        title: undefined,
        type: 'application/rss+xml',
        href: '/feed.xml'
      });
    });

    it('should ignore feed links without href', async () => {
      const html = `
        <html>
          <head>
            <link rel="alternate" type="application/rss+xml" title="RSS Feed">
          </head>
        </html>
      `;
      
      const dom = new JSDOM(html);
      const document = dom.window.document;
      
      const metadata = await scraper.scrape(document);
      
      expect(metadata.feeds).toHaveLength(0);
    });
  });
});