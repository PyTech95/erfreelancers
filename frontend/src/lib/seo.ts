// Client-side SEO: SPA pages must update title, description, canonical and social
// tags per route, otherwise every URL shares the static homepage metadata.
const upsertMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
};

export interface SeoOptions {
  title: string;
  description?: string;
  path?: string;
  noindex?: boolean;
}

export function applySeo({ title, description, path, noindex }: SeoOptions) {
  const origin = window.location.origin;
  const url = `${origin}${path ?? window.location.pathname}`;
  document.title = title;

  let canonical = document.head.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.href = url;

  upsertMeta('name', 'robots', noindex
    ? 'noindex, nofollow'
    : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

  if (description) {
    upsertMeta('name', 'description', description);
    upsertMeta('property', 'og:description', description);
    upsertMeta('name', 'twitter:description', description);
  }
  upsertMeta('property', 'og:title', title);
  upsertMeta('property', 'og:url', url);
  upsertMeta('property', 'og:type', 'website');
  upsertMeta('name', 'twitter:title', title);
}
