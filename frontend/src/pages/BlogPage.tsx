import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowRight, FileText } from 'lucide-react';
import { apiFetch } from '../api';
import { BlogContent } from '../components/BlogContent';

export default function BlogPage() {
  const slug = window.location.pathname.split('/').filter(Boolean)[1];
  const [data, setData] = useState<any>(null); const [error, setError] = useState(''); const [page, setPage] = useState(1);
  useEffect(() => {
    setData(null); setError('');
    apiFetch(slug ? `/api/blog/${encodeURIComponent(slug)}` : `/api/blog?page=${page}`).then(async r => { if (!r.ok) throw new Error(r.status === 404 ? 'This post is not available.' : 'Could not load the blog. Please try again.'); return r.json(); }).then(d => {
      setData(d); document.title = slug ? `${d.title} | ER Freelancer` : 'Blog | ER Freelancer';
      const description = document.querySelector('meta[name="description"]'); if (description) description.setAttribute('content', slug ? (d.excerpt || d.title) : 'Ideas and insights on freelance design, development and building your business.');
      const canonical = document.querySelector('link[rel="canonical"]'); if (canonical) canonical.setAttribute('href', `${new URL(canonical.getAttribute('href')!).origin}/blog${slug ? `/${slug}` : ''}`);
    }).catch(e => setError(e.message));
  }, [slug, page]);
  return <div data-testid="public-blog-page" className="min-h-screen bg-white text-slate-900">
    <header className="border-b border-slate-200"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-5"><a data-testid="blog-home" href="/" className="flex items-center gap-3 font-display text-xl font-semibold"><img src="/freelancer-icon.svg" alt="" className="h-8 w-8" />ER Freelancer</a><a data-testid="blog-inquiry-link" href="/#hero" className="flex items-center gap-2 text-sm font-medium text-emerald-700">Start a project<ArrowRight size={16} /></a></div></header>
    <main className="mx-auto max-w-6xl px-5 py-10 sm:py-16">
      {error ? <div data-testid="public-blog-error" role="alert"><p>{error}</p><a data-testid="blog-error-back" href="/blog" className="mt-5 inline-block text-indigo-700">Back to blog</a></div> : !data ? <p data-testid="public-blog-loading" className="text-sm text-slate-500">Loading…</p> : slug ? <article className="mx-auto max-w-3xl"><a data-testid="blog-back" href="/blog" className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500"><ArrowLeft size={16} />All posts</a><p data-testid="public-post-category" className="text-sm text-emerald-700">{data.category}</p><h1 data-testid="public-post-title" className="mt-4 break-words font-display text-4xl font-semibold leading-tight sm:text-5xl">{data.title}</h1><p data-testid="public-post-meta" className="mb-10 mt-5 text-xs text-slate-500">{data.author} · {new Date(data.publishedAt).toLocaleDateString()}</p><BlogContent content={data.content} /></article> : <>
        <p className="text-sm font-medium text-emerald-700">THE ER FREELANCER JOURNAL</p><h1 className="mb-12 mt-3 font-display text-4xl font-semibold sm:text-5xl lg:text-6xl">Ideas worth building.</h1>
        {data.posts.length === 0 ? <div data-testid="public-blog-empty" className="border-y border-slate-200 py-16"><FileText size={32} className="mb-4 text-slate-300" /><p className="text-sm text-slate-500">New stories are on their way.</p></div> : <div className="grid gap-x-10 gap-y-12 md:grid-cols-2 lg:grid-cols-3">{data.posts.map((post: any) => <article data-testid={`public-blog-post-${post.id}`} key={post.id} className="border-t-2 border-emerald-500 pt-5"><p className="text-xs font-medium text-emerald-700">{post.category}</p><h2 className="mt-3 font-display text-lg font-semibold"><a data-testid={`public-blog-read-${post.id}`} href={`/blog/${post.slug}`} className="hover:text-emerald-700">{post.title}</a></h2><p className="mt-3 text-sm leading-relaxed text-slate-500">{post.excerpt}</p><p className="mt-5 text-xs text-slate-400">{post.author} · {new Date(post.publishedAt).toLocaleDateString()}</p></article>)}</div>}
        {data.total > 12 && <div className="mt-10 flex justify-between"><button data-testid="public-blog-previous" disabled={page === 1} onClick={() => setPage(page - 1)} className="p-3 text-sm disabled:opacity-40">Previous</button><span data-testid="public-blog-pagination" className="p-3 text-sm">{page} / {Math.ceil(data.total / 12)}</span><button data-testid="public-blog-next" disabled={page * 12 >= data.total} onClick={() => setPage(page + 1)} className="p-3 text-sm disabled:opacity-40">Next</button></div>}
      </>}
    </main>
  </div>;
}