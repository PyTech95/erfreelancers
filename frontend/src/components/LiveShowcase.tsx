import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Search, ExternalLink, Copy, Check, ArrowUpRight, X, Globe,
  Sparkles, MousePointerClick, LayoutGrid
} from 'lucide-react';
import {
  SHOWCASE_SITES, SHOWCASE_CATEGORIES, screenshotUrl,
  ShowcaseSite, ShowcaseCategoryId
} from '../data/showcaseData';

const CATEGORY_LABEL: Record<string, string> = Object.fromEntries(
  SHOWCASE_CATEGORIES.map(c => [c.id, c.name])
);

// Live thumbnails render progressively; a skeleton avoids layout jank on slow loads.
const Thumb: React.FC<{ site: ShowcaseSite; className?: string; w?: number; h?: number }> = ({ site, className = '', w = 1040, h = 800 }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100" />
      )}
      <img
        src={screenshotUrl(site.url, w, h)}
        alt={`${site.name} website screenshot`}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        data-testid={`showcase-thumb-${site.id}`}
        className={`h-full w-full object-cover object-top transition-all duration-700 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export const LiveShowcase: React.FC<{ onOpenEnquiry?: (serviceId?: string) => void }> = ({ onOpenEnquiry }) => {
  const [category, setCategory] = useState<'all' | ShowcaseCategoryId>('all');
  const [query, setQuery] = useState('');
  const [count, setCount] = useState(12);
  const [active, setActive] = useState<ShowcaseSite | null>(null);
  const [copiedId, setCopiedId] = useState('');

  const filtered = useMemo(() => SHOWCASE_SITES.filter(site =>
    (category === 'all' || site.category === category) &&
    `${site.name} ${site.tagline} ${site.description} ${site.tags.join(' ')} ${site.url}`
      .toLowerCase().includes(query.trim().toLowerCase())
  ), [category, query]);

  const copyLink = async (site: ShowcaseSite) => {
    try {
      await navigator.clipboard.writeText(site.url);
      setCopiedId(site.id);
      setTimeout(() => setCopiedId(c => (c === site.id ? '' : c)), 2200);
    } catch {
      window.prompt('Copy this link and paste it in your next tab:', site.url);
    }
  };

  return (
    <section id="work" data-testid="live-showcase" className="relative overflow-hidden border-b border-slate-200 bg-slate-950 py-20 sm:py-28 text-left">
      {/* Depth: layered ambient glows on a solid dark canvas */}
      <div aria-hidden className="pointer-events-none absolute -top-32 -right-24 h-[420px] w-[420px] rounded-full bg-indigo-600/25 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute bottom-0 -left-24 h-[380px] w-[380px] rounded-full bg-emerald-500/15 blur-[120px]" />
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.05)_1px,transparent_0)] [background-size:32px_32px]" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <motion.span
            initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" />
            Live Inspiration Gallery
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            data-testid="showcase-heading"
            className="mt-6 font-display text-4xl font-semibold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
            World-class websites,
            <span className="block bg-gradient-to-r from-emerald-300 via-teal-200 to-indigo-300 bg-clip-text text-transparent">
              built to this standard.
            </span>
          </motion.h2>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-slate-300">
            Explore {SHOWCASE_SITES.length}+ of the most admired live products on the web. Click any card to see the
            details, open the real site in a new tab, or copy its link to study later.
          </p>
          <p data-testid="showcase-hint" className="mt-4 inline-flex items-start gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300 backdrop-blur">
            <MousePointerClick className="mt-0.5 h-4 w-4 shrink-0 text-emerald-300" />
            <span>Tip: hit <strong className="font-semibold text-white">Copy link</strong>, then paste it in your next browser tab to open the full website.</span>
          </p>
        </div>

        {/* Controls */}
        <div className="mt-10 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              data-testid="showcase-search"
              value={query}
              onChange={e => { setQuery(e.target.value); setCount(12); }}
              placeholder="Search by name, category or tech…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder:text-slate-400 outline-none backdrop-blur transition-colors focus:border-emerald-400/60"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              data-testid="showcase-cat-all"
              onClick={() => { setCategory('all'); setCount(12); }}
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${category === 'all' ? 'bg-white text-slate-900' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
              <LayoutGrid className="h-3.5 w-3.5" /> All
            </button>
            {SHOWCASE_CATEGORIES.map(cat => (
              <button
                key={cat.id}
                data-testid={`showcase-cat-${cat.id}`}
                onClick={() => { setCategory(cat.id); setCount(12); }}
                className={`rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${category === cat.id ? 'bg-emerald-400 text-slate-950' : 'border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10'}`}>
                {cat.name.split(' & ')[0]}
              </button>
            ))}
          </div>
        </div>

        <p data-testid="showcase-results-count" className="mt-6 text-sm text-slate-400">{filtered.length} sites</p>

        {/* Grid */}
        {filtered.length === 0 ? (
          <p data-testid="showcase-empty" className="py-20 text-center text-slate-400">No sites match your search. Try another keyword.</p>
        ) : (
          <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.slice(0, count).map((site, i) => (
              <motion.article
                key={site.id}
                data-testid={`showcase-card-${site.id}`}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: (i % 3) * 0.08 }}
                onClick={() => setActive(site)}
                className="group flex cursor-pointer flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-400/40 hover:bg-white/[0.07]">
                <div className="relative aspect-[16/11] w-full overflow-hidden">
                  <Thumb site={site} className="h-full w-full" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-70 transition-opacity group-hover:opacity-40" />
                  <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-slate-950/70 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-200 backdrop-blur">
                    {CATEGORY_LABEL[site.category]?.split(' & ')[0]}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 flex translate-y-2 items-center justify-center gap-2 p-4 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-slate-900 shadow-lg">
                      View details <ArrowUpRight className="h-3.5 w-3.5" />
                    </span>
                  </div>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-display text-lg font-semibold text-white">{site.name}</h3>
                    <Globe className="h-4 w-4 shrink-0 text-slate-500" />
                  </div>
                  <p className="mt-1 text-xs font-medium text-emerald-300/90">{site.tagline}</p>
                  <p className="mt-3 line-clamp-2 text-sm leading-relaxed text-slate-400">{site.description}</p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {site.tags.slice(0, 3).map(t => (
                      <span key={t} className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-medium text-slate-300">{t}</span>
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {count < filtered.length && (
          <div className="mt-12 text-center">
            <button
              data-testid="showcase-load-more"
              onClick={() => setCount(c => c + 12)}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-all hover:border-emerald-400/50 hover:bg-white/10">
              Load more sites
              <span className="text-slate-400">({filtered.length - count} more)</span>
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {active && (
        <div
          data-testid="showcase-modal"
          className="fixed inset-0 z-[80] flex items-end justify-center bg-slate-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          onClick={() => setActive(null)}>
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.3 }}
            onClick={e => e.stopPropagation()}
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-white/10 bg-slate-900 sm:rounded-3xl">
            <button
              data-testid="showcase-modal-close"
              onClick={() => setActive(null)}
              aria-label="Close"
              className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-950/70 text-white backdrop-blur transition-colors hover:bg-slate-950">
              <X className="h-5 w-5" />
            </button>

            <div className="overflow-y-auto overscroll-contain">
              <Thumb site={active} className="aspect-[16/9] w-full" w={1280} h={720} />

              <div className="p-6 sm:p-8">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-400/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-300">
                    {CATEGORY_LABEL[active.category]}
                  </span>
                  <span className="text-xs text-slate-400">{active.tagline}</span>
                </div>
                <h3 data-testid="showcase-modal-title" className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">{active.name}</h3>
                <p className="mt-4 text-base leading-relaxed text-slate-300">{active.description}</p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {active.tags.map(t => (
                    <span key={t} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">{t}</span>
                  ))}
                </div>

                {/* Link box + copy hint */}
                <div className="mt-7 rounded-2xl border border-white/10 bg-white/[0.03] p-4">
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Live website link</p>
                  <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center">
                    <code data-testid="showcase-modal-url" className="flex-1 break-all rounded-lg bg-slate-950/60 px-3 py-2.5 font-mono text-sm text-emerald-300">{active.url}</code>
                    <button
                      data-testid="showcase-modal-copy"
                      onClick={() => copyLink(active)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                      {copiedId === active.id ? <><Check className="h-4 w-4 text-emerald-400" /> Copied!</> : <><Copy className="h-4 w-4" /> Copy link</>}
                    </button>
                  </div>
                  <p className="mt-3 flex items-start gap-2 text-xs text-slate-400">
                    <MousePointerClick className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-300" />
                    Copy this link and paste it in your next browser tab to open the full website.
                  </p>
                </div>

                {/* Actions */}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <a
                    data-testid="showcase-modal-visit"
                    href={active.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-400 px-5 py-3.5 text-sm font-bold text-slate-950 transition-colors hover:bg-emerald-300">
                    Visit live website <ExternalLink className="h-4 w-4" />
                  </a>
                  <button
                    data-testid="showcase-modal-build"
                    onClick={() => { onOpenEnquiry?.('S01'); setActive(null); }}
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-white/10">
                    Build something like this <ArrowUpRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
