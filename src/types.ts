// Core metadata provider interface
export interface MetadataProvider {
  readonly name: string;
  readonly priority: number;
  canHandle(element: Element): boolean;
  scrape(element: Element): { key: string; value: string } | null;
  getValue(key: string, data: Map<string, string[]>): string | undefined;
}

// Provider data aggregation interface
export interface ProviderData {
  [providerName: string]: Map<string, string[]>;
}

// Feed/RSS link interface
export interface Feed {
  title?: string;
  type: string;
  href: string;
}
