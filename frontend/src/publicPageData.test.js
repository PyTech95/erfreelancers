import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
import { apiFetch } from './api';
import { usePublicPage } from './publicPageData';
import { publicPath } from './publicRoutes';

jest.mock('./api', () => ({ apiFetch: jest.fn() }));

const origin = 'https://erfreelancers.com';
const landingPath = '/australia/brisbane/fortitude-valley/freelance-crm-developer/';
const pageData = (path = '/', overrides = {}) => ({
  path, canonical: origin + path, title: 'Freelance services | ER Freelancer',
  description: 'Discuss a freelance project.', robots: 'index,follow', kind: 'service',
  heading: 'Freelance services', sections: [{ heading: 'Scope', body: 'Agreed deliverables.' }],
  structuredData: [{ '@context': 'https://schema.org', '@type': 'WebPage', name: 'Freelance services' }],
  status: 200, ...overrides,
});

let container;
let root;
function Probe({ path }) {
  const { data, error } = usePublicPage(path);
  return <div>{data ? `${data.kind}: ${data.path}` : error || 'Loading'}</div>;
}
async function render(path) {
  window.history.replaceState({}, '', path);
  await act(async () => { root.render(<Probe path={path} />); });
}
function bootstrap(data) {
  const element = document.createElement('script');
  element.id = 'page-data';
  element.type = 'application/json';
  element.textContent = JSON.stringify(data);
  document.body.appendChild(element);
}
function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => payload };
}
const robots = () => document.querySelector('meta[name="robots"]').content;

beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  document.head.innerHTML = `<title>Known homepage</title><meta name="description" content="Known homepage description"><meta name="robots" content="index,follow"><link rel="canonical" href="${origin}/">`;
  document.body.innerHTML = '';
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
});
afterEach(async () => {
  await act(async () => { root.unmount(); });
});

test.each(['network rejection', 'malformed JSON', 'missing robots'])('homepage keeps its known metadata on %s', async failure => {
  if (failure === 'network rejection') apiFetch.mockRejectedValue(new Error('offline'));
  else if (failure === 'malformed JSON') apiFetch.mockResolvedValue({ ok: true, status: 200, json: async () => { throw new Error('invalid JSON'); } });
  else apiFetch.mockResolvedValue(response(pageData('/', { robots: undefined })));
  const before = document.head.innerHTML;
  await render('/');
  expect(container.textContent).toContain('could not be loaded');
  expect(document.head.innerHTML).toBe(before);
  expect(robots()).toBe('index,follow');
});

test('draft bootstrap is authoritative and remains noindex without any metadata request', async () => {
  bootstrap(pageData(landingPath, { kind: 'landing', robots: 'noindex,follow', page: { lifecycleState: 'needs_review', publishedAt: null, indexable: false } }));
  await render(landingPath);
  expect(apiFetch).not.toHaveBeenCalled();
  expect(container.textContent).toBe(`landing: ${landingPath}`);
  expect(robots()).toBe('noindex,follow');
  expect(document.querySelector('link[rel="canonical"]').href).toBe(origin + landingPath);
  expect(window.location.pathname).toBe(landingPath);
});

test('private page metadata stays noindex when a request fails', async () => {
  document.querySelector('link[rel="canonical"]').href = origin + '/account/';
  document.querySelector('meta[name="robots"]').content = 'noindex,nofollow';
  document.title = 'Private account';
  apiFetch.mockRejectedValue(new Error('offline'));
  await render('/account/');
  expect(document.title).toBe('Private account');
  expect(robots()).toBe('noindex,nofollow');
});

test('real 404 response retains its requested URL and noindex state', async () => {
  apiFetch.mockResolvedValue(response(pageData('/does-not-exist/', { kind: 'not-found', status: 404, title: 'Page not found', robots: 'noindex,follow' }), 404));
  await render('/does-not-exist/');
  expect(container.textContent).toBe('not-found: /does-not-exist/');
  expect(document.title).toBe('Page not found');
  expect(robots()).toBe('noindex,follow');
  expect(window.location.pathname).toBe('/does-not-exist/');
});

test('unknown route with incomplete payload is never defaulted to indexable', async () => {
  apiFetch.mockResolvedValue(response(pageData('/unconfirmed/', { robots: undefined })));
  await render('/unconfirmed/');
  expect(container.textContent).toContain('could not be loaded');
  expect(robots()).toBe('noindex,follow');
  expect(document.querySelector('link[rel="canonical"]').href).toBe(origin + '/unconfirmed/');
});

test('country-first route and legacy API alias use the same short canonical', async () => {
  apiFetch.mockResolvedValue(response(pageData(landingPath, { kind: 'landing', robots: 'noindex,follow' })));
  await render('/locations' + landingPath);
  expect(container.textContent).toBe(`landing: ${landingPath}`);
  expect(document.querySelector('link[rel="canonical"]').href).toBe(origin + landingPath);
  await render(landingPath);
  expect(container.textContent).toBe(`landing: ${landingPath}`);
  expect(window.location.pathname).toBe(landingPath);
});

test.each(['/?page=2', '/?page=bogus', '/join-as-freelancer/?page=2'])('404 bootstrap for invalid pagination is retained: %s', async path => {
  const pathname = path.split('?')[0];
  bootstrap(pageData(pathname, { kind: 'not-found', robots: 'noindex,follow', status: 404 }));
  await render(path);
  expect(apiFetch).not.toHaveBeenCalled();
  expect(container.textContent).toBe(`not-found: ${pathname}`);
  expect(robots()).toBe('noindex,follow');
});

test('a later successful page replaces a previous error robots state and schema', async () => {
  apiFetch.mockRejectedValueOnce(new Error('offline'));
  await render('/unknown/');
  expect(robots()).toBe('noindex,follow');
  apiFetch.mockResolvedValueOnce(response(pageData('/services/freelance-web-developer/')));
  await render('/services/freelance-web-developer/');
  expect(robots()).toBe('index,follow');
  expect(document.title).toBe('Freelance services | ER Freelancer');
  expect(document.querySelectorAll('script[type="application/ld+json"]')).toHaveLength(1);
});

test('individual location links shorten while the directory and other routes remain unchanged', () => {
  expect(publicPath('/locations' + landingPath)).toBe(landingPath);
  expect(publicPath('/locations/')).toBe('/locations/');
  expect(publicPath('/locations/?page=2')).toBe('/locations/?page=2');
  expect(publicPath('/services/freelance-web-developer/')).toBe('/services/freelance-web-developer/');
  expect(publicPath('tel:+919711623561')).toBe('tel:+919711623561');
});
