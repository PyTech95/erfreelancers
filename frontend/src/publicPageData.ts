import { useEffect, useState } from 'react';
import { apiFetch } from './api';
import { FreelancerProfile, LocationEntity, PageRecord, ServiceDefinition } from './types';
import { publicPath } from './publicRoutes';

export const SITE_URL = (process.env.REACT_APP_SITE_URL || 'https://erfreelancers.com').replace(/\/$/, '');

export interface PublicLink { label: string; href: string }
export interface PublicPageData {
  path: string;
  canonical?: string;
  title: string;
  description: string;
  robots: string;
  kind: string;
  heading: string;
  sections: { heading: string; body: string; links?: PublicLink[] }[];
  links?: PublicLink[];
  service?: ServiceDefinition;
  location?: LocationEntity;
  page?: PageRecord;
  profile?: FreelancerProfile;
  profiles?: FreelancerProfile[];
  posts?: any[];
  post?: any;
  pagination?: { page: number; pages: number; total: number; next?: string | null; previous?: string | null };
  structuredData?: unknown;
  schema?: unknown;
  schemas?: unknown;
  status?: number;
}

const routeKey = (path: string) => {
  const url = new URL(path, SITE_URL);
  const page = url.searchParams.get('page');
  return `${publicPath(url.pathname).replace(/\/+$/, '') || '/'}${page !== null && page !== '1' ? `?page=${encodeURIComponent(page)}` : ''}`;
};

const explicitIndexingPolicy = (robots: unknown): robots is string => typeof robots === 'string'
  && /(?:^|[\s,])(?:index|noindex|all|none)(?:$|[\s,])/i.test(robots);

/** An incomplete response must never turn a draft, private page or 404 indexable. */
function validPublicPage(value: unknown, requestedPath: string): value is PublicPageData {
  if (!value || typeof value !== 'object') return false;
  const page = value as PublicPageData;
  if (!['path', 'title', 'kind', 'heading'].every(key => typeof page[key as keyof PublicPageData] === 'string' && String(page[key as keyof PublicPageData]).trim())) return false;
  if (!page.path.startsWith('/') || page.path.startsWith('//') || page.path.includes('\\')) return false;
  if (typeof page.description !== 'string' || !explicitIndexingPolicy(page.robots)) return false;
  if (!Array.isArray(page.sections) || !page.sections.every(section => section && typeof section.heading === 'string' && typeof section.body === 'string')) return false;
  if ((page.kind === 'not-found' || page.kind === 'private' || page.status === 404) && !/(?:noindex|none)/i.test(page.robots)) return false;
  if (page.page && (!['approved', 'published'].includes(page.page.lifecycleState) || !page.page.publishedAt || (page.page as PageRecord & { indexable?: boolean }).indexable === false) && !/(?:noindex|none)/i.test(page.robots)) return false;
  try {
    const pageUrl = new URL(page.path, SITE_URL);
    if (page.pagination?.page && page.pagination.page > 1) pageUrl.searchParams.set('page', String(page.pagination.page));
    if (page.canonical && (typeof page.canonical !== 'string' || !/^https?:$/.test(new URL(page.canonical).protocol))) return false;
    // A 404 for malformed/out-of-range pagination still belongs to this pathname.
    if (page.kind === 'not-found') return publicPath(pageUrl.pathname).replace(/\/+$/, '') === publicPath(new URL(requestedPath, SITE_URL).pathname).replace(/\/+$/, '');
    return routeKey(pageUrl.href) === routeKey(requestedPath);
  } catch {
    return false;
  }
}

function bootstrapPage(path: string): PublicPageData | null {
  try {
    const element = document.getElementById('page-data');
    if (!element?.textContent) return null;
    const page: unknown = JSON.parse(element.textContent);
    return validPublicPage(page, path) ? page : null;
  } catch {
    return null;
  }
}

function setMeta(key: string, content: string, attribute: 'name' | 'property' = 'name') {
  let element = document.head.querySelector<HTMLMetaElement>(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement('meta');
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.content = content;
}

/** Apply only the metadata belonging to the URL being displayed. */
export function applyPageMetadata(page: Pick<PublicPageData, 'path' | 'title' | 'description' | 'robots'> & Partial<PublicPageData>) {
  const canonicalUrl = page.canonical || `${SITE_URL}${page.path}`;
  document.title = page.title;
  setMeta('description', page.description);
  setMeta('robots', explicitIndexingPolicy(page.robots) ? page.robots : 'noindex,follow');
  setMeta('og:title', page.title, 'property');
  setMeta('og:description', page.description, 'property');
  setMeta('og:url', canonicalUrl, 'property');
  setMeta('og:type', page.kind === 'post' ? 'article' : 'website', 'property');
  setMeta('og:site_name', 'ER Freelancer', 'property');
  setMeta('twitter:card', 'summary');
  setMeta('twitter:title', page.title);
  setMeta('twitter:description', page.description);
  let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = canonicalUrl;
  // One route-owned graph prevents homepage schema leaking onto other URLs.
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach(node => node.remove());
  const schema = page.structuredData || page.schema || page.schemas;
  if (schema) {
    const script = document.createElement('script');
    script.id = 'page-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
  }
}

function preserveExistingMetadata(path: string): boolean {
  // The server's route-specific head (or the known static homepage head) remains
  // authoritative when a metadata fetch fails. A network failure is not a deindexing instruction.
  const canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')?.href;
  const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]')?.content;
  try {
    return !!canonical && explicitIndexingPolicy(robots) && !!document.title && routeKey(canonical) === routeKey(path);
  } catch {
    return false;
  }
}

export function usePublicPage(path: string) {
  const [data, setData] = useState<PublicPageData | null>(() => bootstrapPage(path));
  const [error, setError] = useState('');

  useEffect(() => {
    const initial = bootstrapPage(path);
    setData(initial);
    setError('');
    if (initial) return;
    const controller = new AbortController();
    const url = new URL(path, SITE_URL);
    const page = url.searchParams.get('page') ?? '1';
    apiFetch(`/api/public-page?path=${encodeURIComponent(url.pathname)}&page=${encodeURIComponent(page)}`, { signal: controller.signal })
      .then(async response => {
        const payload = await response.json();
        if (validPublicPage(payload, path)
          && (response.ok || (response.status === 404 && payload.kind === 'not-found'))
          && (payload.status === undefined || payload.status === response.status)) return payload;
        throw new Error('This page could not be loaded. Please try again.');
      })
      .then(payload => { if (!controller.signal.aborted) setData(payload); })
      .catch(() => { if (!controller.signal.aborted) setError('This page could not be loaded. Please try again.'); });
    return () => controller.abort();
  }, [path]);

  useEffect(() => {
    if (data && validPublicPage(data, path)) applyPageMetadata(data);
    else if (error && !preserveExistingMetadata(path)) applyPageMetadata({ path: publicPath(path), title: 'Page temporarily unavailable | ER Freelancer', description: 'The requested page is temporarily unavailable. Please try again.', robots: 'noindex,follow' });
  }, [data, error, path]);

  return { data, error };
}
