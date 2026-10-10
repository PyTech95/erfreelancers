import React, { useState } from 'react';
import { ArrowLeft, Save, Eye, Pencil } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { BlogContent } from '../BlogContent';

export const BlogEditor = ({ post, busy, onSave, onCancel }: { post: any; busy: boolean; onSave: (post: any) => void; onCancel: () => void }) => {
  const [form, setForm] = useState(post);
  const [preview, setPreview] = useState(false);
  const edit = (key: string, value: string) => setForm({ ...form, [key]: value });
  const cancel = () => { if (JSON.stringify(form) === JSON.stringify(post) || window.confirm('Discard unsaved changes?')) onCancel(); };
  return <form data-testid="blog-editor-form" onSubmit={e => { e.preventDefault(); onSave(form); }} className="space-y-6">
    <div className="flex flex-wrap items-center justify-between gap-3"><Button data-testid="blog-editor-back" type="button" variant="ghost" onClick={cancel} disabled={busy}><ArrowLeft size={16} />All posts</Button><div className="flex gap-2"><Button data-testid="blog-editor-preview" type="button" variant="outline" onClick={() => setPreview(!preview)}>{preview ? <Pencil size={16} /> : <Eye size={16} />}{preview ? 'Edit' : 'Preview'}</Button><Button data-testid="blog-save-post" type="submit" disabled={busy}><Save size={16} />{busy ? 'Saving…' : form.status === 'published' ? 'Save & publish' : 'Save draft'}</Button></div></div>
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_260px]"><div className="min-w-0 space-y-5">
      <label className="block space-y-2 text-sm font-medium">Title<Input data-testid="blog-title-input" required minLength={3} maxLength={160} value={form.title} onChange={e => edit('title', e.target.value)} placeholder="Give your story a title" /></label>
      <label className="block space-y-2 text-sm font-medium">Excerpt<textarea data-testid="blog-excerpt-input" maxLength={400} rows={3} value={form.excerpt} onChange={e => edit('excerpt', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white p-3 text-sm" /></label>
      {preview ? <article data-testid="blog-preview" className="min-h-80 border-y border-slate-200 py-6"><h2 className="mb-5 font-display text-lg font-semibold">{form.title || 'Untitled post'}</h2><BlogContent content={form.content} /></article> : <label className="block space-y-2 text-sm font-medium">Content <span className="font-normal text-slate-500">· Markdown</span><textarea data-testid="blog-content-input" required minLength={10} maxLength={60000} rows={18} value={form.content} onChange={e => edit('content', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white p-4 font-mono text-sm leading-relaxed" /></label>}
    </div><div className="space-y-5 border-t border-slate-200 pt-6 xl:border-l xl:border-t-0 xl:pl-6 xl:pt-0">
      <label className="block space-y-2 text-sm font-medium">Status<select data-testid="blog-status-select" value={form.status} onChange={e => edit('status', e.target.value)} className="w-full rounded-md border border-slate-200 bg-white p-2.5 text-sm"><option value="draft">Draft</option><option value="published">Published</option></select></label>
      <label className="block space-y-2 text-sm font-medium">URL slug<Input data-testid="blog-slug-input" maxLength={180} pattern="[a-z0-9]+(-[a-z0-9]+)*" value={form.slug} onChange={e => edit('slug', e.target.value)} placeholder="Generated from title" /></label>
      <label className="block space-y-2 text-sm font-medium">Author<Input data-testid="blog-author-input" required maxLength={100} value={form.author} onChange={e => edit('author', e.target.value)} /></label>
      <label className="block space-y-2 text-sm font-medium">Category<Input data-testid="blog-category-input" required maxLength={60} value={form.category} onChange={e => edit('category', e.target.value)} /></label>
    </div></div>
  </form>;
};