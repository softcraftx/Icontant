export interface Country {
  code: string;
  name: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Subcategory {
  id: number;
  parent_id: number;
  name: string;
  slug: string;
}

export interface WebsiteProfile {
  id: string;
  name: string;
  description: string;
  tone: string;
  hasDynamicCategories?: boolean;
}

export interface SeoAudit {
  titleLength: string;
  powerWords: string;
  keywordInTitle: string;
  metaDescLength: string;
  keywordInMeta: string;
  keywordInSlug: string;
  keywordDensity: string;
  keywordInFirstPara: string;
  cannibalizationCheck: string;
  readabilityAudit: string;
  transitionWords: string;
  internalLinking: string;
  externalLinking: string;
}

export interface SeoResult {
  topic: string;
  website_name: string;
  seoTitle: string;
  seoSlug: string;
  metaDescription: string;
  metaKeywords: string;
  websiteTags: string[];
  articleContent: string;
  analysisSummary: string;
  seoAudit?: SeoAudit;
}

export interface GroundingSource {
  uri: string;
  title: string;
}

export interface GeneratedResponse {
  result: SeoResult | null;
  sources: GroundingSource[];
  error?: string;
}

export type LoadingState = 'idle' | 'analyzing' | 'writing' | 'optimizing' | 'complete' | 'error';
