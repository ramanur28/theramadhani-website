export interface BreadcrumbItem {
  name: string;
  url: string;
}

export interface FAQItem {
  question: string;
  answer: string;
}

export interface ServiceSchemaData {
  name: string;
  serviceType: string;
  description: string;
  url: string;
  providerName?: string;
  providerUrl?: string;
  areaServed?: string;
  offers?: {
    price?: string;
    priceCurrency?: string;
    description?: string;
  };
}

export interface ArticleSchemaData {
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  authorName: string;
  authorUrl: string;
  imageUrl: string;
  articleUrl: string;
  keywords?: string[];
}

export interface PersonSchemaData {
  name: string;
  jobTitle: string;
  worksFor?: string;
  url: string;
  image?: string;
  sameAs?: string[];
  knowsAbout?: string[];
  description?: string;
  hasCredential?: string[];
}
