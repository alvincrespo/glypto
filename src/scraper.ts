import { Metadata } from './metadata.js';
import { ProviderRegistry } from './provider-registry.js';

export class Scraper {
  private registry: ProviderRegistry;
  private document!: Document;
  private result!: Metadata;

  constructor(registry: ProviderRegistry) {
    this.registry = registry;
  }

  async scrape(document: Document): Promise<Metadata> {
    if (!document || typeof document.querySelectorAll !== "function") {
      throw new TypeError("DOM Document expected.");
    }

    this.document = document;
    this.result = new Metadata(this.registry);

    return this
      .scrapeMetaTags()
      .scrapeTitleTag()
      .scrapeHeadingTags()
      .scrapeLinkTags()
      .scrapeFeedLinks()
      .getResult();
  }

  private scrapeMetaTags(): this {
    const metaTags = this.document.querySelectorAll("meta");
    for (const tag of metaTags) {
      this.scrapeFromElement(tag);
    }
    return this;
  }

  private scrapeTitleTag(): this {
    const titleTag = this.document.querySelector("title");
    if (titleTag) {
      this.scrapeFromElement(titleTag);
    }
    return this;
  }

  private scrapeHeadingTags(): this {
    const h1Tag = this.document.querySelector("h1");
    if (h1Tag) {
      this.scrapeFromElement(h1Tag);
    }
    return this;
  }

  private scrapeLinkTags(): this {
    const linkTags = this.document.querySelectorAll("link[rel]");
    for (const tag of linkTags) {
      this.scrapeFromElement(tag);
    }
    return this;
  }

  private scrapeFeedLinks(): this {
    // Handle feed links separately (they have special structure)
    const feedLinkTags = this.document.querySelectorAll("link[rel='alternate']");
    for (const tag of feedLinkTags) {
      const title = tag.getAttribute("title") || undefined;
      const type = tag.getAttribute("type") || "";
      const href = tag.getAttribute("href");

      if (href) {
        this.result.feeds.push({ title, type, href });
      }
    }
    return this;
  }

  private scrapeFromElement(element: Element): void {
    const extraction = this.registry.scrapeFromElement(element);
    if (extraction) {
      this.result.addData(extraction.provider.name, extraction.data.key, extraction.data.value);
    }
  }

  private getResult(): Metadata {
    return this.result;
  }
}
