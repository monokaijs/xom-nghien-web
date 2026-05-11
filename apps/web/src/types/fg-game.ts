export interface FgCatalogEntry {
  id: number;
  slug: string;
  title: string;
  postImage: string;
  date: string;
}

export interface FgCatalog {
  version: string;
  updatedAt: string;
  games: FgCatalogEntry[];
}

export interface FgGameDetail {
  id: number;
  slug: string;
  date: string;
  modified: string;
  link: string;
  title: string;
  description: string;
  postImage: string;
  screenshotImages: string[];
  downloadCollections: { host: string; urls: string[] }[];
  torrentLinks: { type: string; url: string }[];
  features: string[];
  updateLog: string[];
  additionalNotes: string;
}
