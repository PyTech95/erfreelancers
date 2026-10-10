import React from 'react';
import { ArrowRight, Globe, MapPin, Mail, Phone } from 'lucide-react';
import { BlogContent } from '../components/BlogContent';
import { PublicLink, PublicPageData, usePublicPage } from '../publicPageData';
import { publicPath } from '../publicRoutes';

interface PublicPageProps {
  path?: string;
  onOpenEnquiry?: (serviceId?: string, locationId?: string, freelancerId?: string) => void;
}

function LinkList({ links, cards = false }: { links?: PublicLink[]; cards?: boolean }) {
  const safeLinks = links?.filter(link => typeof link.href === 'string' && ((link.href.startsWith('/') && !link.href.startsWith('//')) || link.href.startsWith('mailto:') || link.href.startsWith('tel:')));
  if (!safeLinks?.length) return null;
  return <ul className={cards ? 'grid gap-3 sm:grid-cols-2 lg:grid-cols-3' : 'flex flex-wrap gap-x-6 gap-y-3'}>
    {safeLinks.map((link, index) => <li key={`${link.href}-${index}`}>
      <a href={publicPath(link.href)} className={cards ? 'flex h-full items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 text-sm font-semibold text-indigo-700 transition hover:border-indigo-400 hover:bg-indigo-50' : 'inline-flex items-center gap-2 text-sm font-semibold text-indigo-700 hover:underline'}>
        {link.label}<ArrowRight aria-hidden="true" size={16} className="shrink-0" />
      </a>
    </li>)}
  </ul>;
}

function PublicPageContent({ data, onOpenEnquiry }: { data: PublicPageData; onOpenEnquiry?: PublicPageProps['onOpenEnquiry'] }) {
  const isError = data.kind === 'not-found';
  const profiles = data.profile ? [data.profile] : data.profiles || [];
  return <div data-testid="public-route-page" className="bg-slate-50/40">
    <section className="border-b border-slate-200 bg-gradient-to-br from-white via-indigo-50/50 to-emerald-50/30">
      <div className="mx-auto max-w-7xl px-5 py-12 sm:px-6 sm:py-20 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-500">
          <a href="/" className="hover:text-indigo-700">Home</a><span aria-hidden="true">/</span>
          {data.kind === 'service' || data.kind === 'landing' ? <><a href="/services/" className="hover:text-indigo-700">Services</a><span aria-hidden="true">/</span></> : null}
          <span aria-current="page">{data.heading}</span>
        </nav>
        <div className="max-w-4xl">
          <p className="mb-4 text-xs font-bold uppercase tracking-widest text-indigo-700">{isError ? 'Page not found' : 'ER Freelancer · Digital services'}</p>
          <h1 data-testid="public-route-heading" className="font-display text-3xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl">{data.heading}</h1>
          {data.description && <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-600 sm:text-lg">{data.description}</p>}
          {!isError && onOpenEnquiry && <button onClick={() => onOpenEnquiry(data.service?.id, data.location?.id, data.profile?.id)} className="mt-8 inline-flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-indigo-700">Discuss your project<ArrowRight aria-hidden="true" size={17} /></button>}
          {isError && <a href="/services/" className="mt-8 inline-flex items-center gap-3 rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-bold text-white hover:bg-indigo-700">Explore services<ArrowRight aria-hidden="true" size={17} /></a>}
        </div>
      </div>
    </section>

    <div className="mx-auto max-w-7xl space-y-10 px-5 py-12 sm:px-6 lg:px-8">
      {data.post && <article className="mx-auto max-w-3xl rounded-2xl border border-slate-200 bg-white p-6 sm:p-10">
        <p className="mb-6 text-sm text-slate-500">{data.post.author}{data.post.publishedAt && <> · <time dateTime={data.post.publishedAt}>{new Date(data.post.publishedAt).toLocaleDateString('en', { year: 'numeric', month: 'long', day: 'numeric' })}</time></>}</p>
      </article>}

      {data.sections.map((section, index) => <section key={`${section.heading}-${index}`} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
        {section.heading && <h2 className="font-display text-xl font-bold text-slate-900 sm:text-2xl">{section.heading}</h2>}
        {section.body && <div className="mt-4 max-w-4xl whitespace-pre-line text-base leading-relaxed text-slate-600">{data.kind === 'post' ? <BlogContent content={section.body} /> : section.body}</div>}
        {section.links?.length ? <div className="mt-6"><LinkList links={section.links} cards /></div> : null}
      </section>)}

      {profiles.length > 0 && <section aria-labelledby="profile-heading">
        <h2 id="profile-heading" className="mb-6 font-display text-2xl font-bold">{data.profile ? 'Working with this freelancer' : 'Freelancers for your project'}</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {profiles.map(profile => <article key={profile.id} className="rounded-2xl border border-slate-200 bg-white p-6">
            <h3 className="text-xl font-bold"><a href={`/freelancers/${profile.slug}/`} className="hover:text-indigo-700">{profile.displayName}</a></h3>
            {profile.primaryTitle && <p className="mt-2 font-medium text-indigo-700">{profile.primaryTitle}</p>}
            {profile.baseLocationName && <p className="mt-3 flex items-center gap-2 text-sm text-slate-600"><MapPin size={15} />Based in {profile.baseLocationName}</p>}
            {profile.deliveryModes?.includes('remote') && <p className="mt-2 flex items-center gap-2 text-sm text-slate-600"><Globe size={15} />{profile.coverageScope === 'worldwide_remote' ? 'Available for remote projects worldwide' : 'Remote collaboration available'}</p>}
            {profile.bio && <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-slate-600">{profile.bio}</p>}
            {profile.languages?.length > 0 && <p className="mt-4 text-sm text-slate-500">Languages: {profile.languages.join(', ')}</p>}
            {onOpenEnquiry && <button onClick={() => onOpenEnquiry(data.service?.id || profile.services?.[0], data.location?.id, profile.id)} className="mt-5 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700">Discuss a project with {profile.displayName}</button>}
          </article>)}
        </div>
      </section>}

      {data.posts && <section aria-label="Articles" className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {data.posts.map(post => <article key={post.id || post.slug} className="rounded-2xl border border-slate-200 bg-white p-6">
          {post.category && <p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{post.category}</p>}
          <h2 className="mt-3 text-xl font-bold"><a href={`/blog/${post.slug}/`} className="hover:text-indigo-700">{post.title}</a></h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-600">{post.excerpt}</p>
          {post.author && <p className="mt-5 text-xs text-slate-500">{post.author}</p>}
        </article>)}
      </section>}

      {data.links?.length ? <section aria-label="Related pages"><LinkList links={data.links} cards /></section> : null}
      {data.pagination && data.pagination.pages > 1 && <nav aria-label="Pagination" className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 text-sm">
        {data.pagination.previous ? <a rel="prev" href={publicPath(data.pagination.previous)} className="font-semibold text-indigo-700">Previous page</a> : <span />}
        <span>Page {data.pagination.page} of {data.pagination.pages}</span>
        {data.pagination.next ? <a rel="next" href={publicPath(data.pagination.next)} className="font-semibold text-indigo-700">Next page</a> : <span />}
      </nav>}

      {!isError && <section className="rounded-2xl bg-slate-900 p-7 text-white sm:p-10">
        <h2 className="font-display text-2xl font-bold">Have a project in mind?</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300">Share your requirements, location and preferred timeline. We will review the brief and discuss a suitable scope and delivery approach.</p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          {onOpenEnquiry && <button onClick={() => onOpenEnquiry(data.service?.id, data.location?.id, data.profile?.id)} className="rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-900 hover:bg-indigo-50">Send a project brief</button>}
          <a href="tel:+919711623561" className="inline-flex items-center gap-2 text-sm font-semibold"><Phone size={16} />Call +91 97116 23561</a>
          <a href="/contact/" className="inline-flex items-center gap-2 text-sm font-semibold"><Mail size={16} />Contact details</a>
        </div>
      </section>}
    </div>
  </div>;
}

export default function PublicPage({ path = `${window.location.pathname}${window.location.search}`, onOpenEnquiry }: PublicPageProps) {
  const { data, error } = usePublicPage(path);
  if (error) return <section className="mx-auto max-w-4xl px-6 py-24" role="alert"><h1 className="text-3xl font-bold">Page temporarily unavailable</h1><p className="mt-5 text-slate-600">{error}</p><button onClick={() => window.location.reload()} className="mt-6 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-semibold text-white">Try again</button><a href="/" className="ml-5 text-sm font-semibold text-indigo-700">Home</a></section>;
  if (!data) return <section aria-live="polite" aria-busy="true" className="mx-auto max-w-7xl px-6 py-24"><p className="text-slate-600">Loading page…</p></section>;
  return <PublicPageContent data={data} onOpenEnquiry={onOpenEnquiry} />;
}
