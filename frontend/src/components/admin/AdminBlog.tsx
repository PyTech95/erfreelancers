import React, { useEffect, useState } from 'react';
import { Plus, FileText, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { toast } from '../ui/sonner';
import { adminRequest } from './adminApi';
import { BlogEditor } from './BlogEditor';

const empty = { title: '', slug: '', content: '', excerpt: '', author: 'ER Freelancer', category: 'Insights', status: 'draft' };
export const AdminBlog = () => {
  const [posts, setPosts] = useState<any[]>([]); const [editing, setEditing] = useState<any>(null);
  const [error, setError] = useState(''); const [busy, setBusy] = useState(false); const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(''); const [status, setStatus] = useState('all');
  const load = async () => { try { setPosts((await adminRequest('/api/admin/blog')).posts); } catch (e: any) { setError(e.message); } finally { setLoading(false); } };
  useEffect(() => { load(); }, []);
  const save = async (post: any) => {
    setBusy(true); setError('');
    const body = Object.fromEntries(Object.keys(empty).map(key => [key, post[key]]));
    try { await adminRequest(post.id ? `/api/admin/blog/${post.id}` : '/api/admin/blog', post.id ? 'PUT' : 'POST', body); setEditing(null); await load(); toast.success(post.status === 'published' ? 'Post published' : 'Draft saved'); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const remove = async (post: any) => {
    if (!window.confirm(`Delete “${post.title}”? This cannot be undone.`)) return;
    setBusy(true); setError(''); try { await adminRequest(`/api/admin/blog/${post.id}`, 'DELETE'); await load(); toast.success('Post deleted'); }
    catch (e: any) { setError(e.message); } finally { setBusy(false); }
  };
  const filtered = posts.filter(p => (status === 'all' || p.status === status) && `${p.title} ${p.author} ${p.category}`.toLowerCase().includes(query.toLowerCase()));
  return <section data-testid="admin-blog-panel" className="space-y-6">
    {error && <p data-testid="blog-error" role="alert" className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
    {editing ? <BlogEditor key={editing.id || 'new'} post={editing} busy={busy} onSave={save} onCancel={() => { setEditing(null); setError(''); }} /> : <>
      <div className="flex flex-wrap items-center justify-between gap-4"><p data-testid="blog-post-count" className="text-sm text-slate-500">{posts.length} posts · {posts.filter(p => p.status === 'published').length} published</p><div className="flex flex-wrap gap-3"><a data-testid="blog-public-link" href="/blog" target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 p-2 text-sm text-indigo-700">Visit blog<ExternalLink size={15} /></a><Button data-testid="blog-new-post" onClick={() => { setEditing({ ...empty }); setError(''); }}><Plus size={16} />New post</Button></div></div>
      <div className="flex flex-wrap gap-3"><Input data-testid="blog-search" aria-label="Search blog posts" placeholder="Search posts…" value={query} onChange={e => setQuery(e.target.value)} className="max-w-sm" /><select data-testid="blog-filter-status" aria-label="Filter post status" value={status} onChange={e => setStatus(e.target.value)} className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"><option value="all">All statuses</option><option value="draft">Draft</option><option value="published">Published</option></select></div>
      {loading ? <p data-testid="blog-loading" className="text-sm text-slate-500">Loading posts…</p> : filtered.length === 0 ? <div data-testid="blog-empty" className="border-y border-slate-200 py-16 text-center"><FileText size={32} className="mx-auto mb-4 text-slate-300" /><p className="text-sm text-slate-500">{posts.length ? 'No matching posts.' : 'Your first story starts here.'}</p></div> : <div className="divide-y divide-slate-200">{filtered.map(post => <article key={post.id} data-testid={`blog-post-${post.id}`} className="flex flex-col justify-between gap-5 py-6 sm:flex-row sm:items-center"><div className="min-w-0"><span data-testid={`blog-post-status-${post.id}`} className={`rounded-md px-2 py-1 text-xs ${post.status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-800'}`}>{post.status}</span><h2 data-testid={`blog-post-title-${post.id}`} className="mt-3 font-display text-lg font-semibold">{post.title}</h2><p className="mt-1 text-xs text-slate-500">{post.author} · {post.category} · {new Date(post.updatedAt).toLocaleDateString()}</p></div><div className="flex shrink-0 gap-2">{post.status === 'published' && <a data-testid={`blog-view-${post.id}`} href={`/blog/${post.slug}`} target="_blank" rel="noreferrer" aria-label="Read published post" title="Read published post" className="grid h-10 w-10 place-items-center rounded-md border border-slate-200 hover:bg-white"><ExternalLink size={16} /></a>}<Button data-testid={`blog-edit-${post.id}`} size="icon" variant="outline" aria-label="Edit post" title="Edit post" disabled={busy} onClick={() => { setEditing(post); setError(''); }}><Pencil size={16} /></Button><Button data-testid={`blog-delete-${post.id}`} size="icon" variant="outline" aria-label="Delete post" title="Delete post" disabled={busy} onClick={() => remove(post)}><Trash2 size={16} className="text-rose-600" /></Button></div></article>)}</div>}
    </>}
  </section>;
};