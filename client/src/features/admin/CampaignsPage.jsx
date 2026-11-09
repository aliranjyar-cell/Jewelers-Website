import { useCallback, useEffect, useState } from 'react';
import { Megaphone, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { adminCampaigns } from '../../lib/api.js';
import { Badge, Card, CardHeader, Skeleton } from './dashboard/components/ui.jsx';

const EMPTY = { title: '', eyebrow: '', body: '', placement: 'hero', status: 'draft', imageUrl: '', mobileImageUrl: '', imageAlt: '', ctaLabel: 'Explore collection', ctaUrl: '/shop', startsAt: '', endsAt: '', priority: 0 };
const inputClass = 'h-11 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200';
const labelClass = 'grid gap-1.5 text-xs font-medium text-neutral-500';
const toLocalInput = (value) => { if (!value) return ''; const date = new Date(value); return Number.isNaN(date.getTime()) ? '' : new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16); };

export default function CampaignsPage() {
  const [items, setItems] = useState([]); const [form, setForm] = useState(EMPTY);
  const [editing, setEditing] = useState(null); const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState('');
  const load = useCallback(async () => { setLoading(true); try { const result = await adminCampaigns.list(); setItems(result.items || []); setError(''); } catch (e) { setError(e.message); } finally { setLoading(false); } }, []);
  useEffect(() => { load(); }, [load]);
  const set = (key) => (event) => setForm((current) => ({ ...current, [key]: event.target.value }));
  function edit(item) {
    setEditing(item.id);
    setForm({ ...EMPTY, ...item, startsAt: toLocalInput(item.startsAt), endsAt: toLocalInput(item.endsAt) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const payload = { ...form, priority: Number(form.priority), startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : null, endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : null };
      if (editing) await adminCampaigns.update(editing, payload); else await adminCampaigns.create(payload);
      setMessage(editing ? 'Campaign updated.' : 'Campaign saved.'); setEditing(null); setForm(EMPTY); await load();
    } catch (e) { setError(e.message); } finally { setSaving(false); }
  }
  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { await adminCampaigns.remove(item.id); setMessage('Campaign deleted.'); await load(); } catch (e) { setError(e.message); }
  }
  async function uploadImage(event, key) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { setError('Campaign images must be 4 MB or smaller.'); return; }
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { setError('Choose a JPEG, PNG, or WebP image.'); return; }
    setError(''); setMessage('Uploading image…');
    try {
      const dataUrl = await new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error('The image could not be read.')); reader.readAsDataURL(file); });
      const result = await adminCampaigns.uploadImage(dataUrl);
      setForm((current) => ({ ...current, [key]: result.imageUrl })); setMessage('Image uploaded. Save the campaign to publish this image.');
    } catch (e) { setMessage(''); setError(e.message); }
  }
  return <div className="space-y-6 pb-8">
    <header className="pt-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Marketing</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Advertising campaigns</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">Publish homepage hero campaigns and announcement banners, schedule when they appear, and send visitors to a product or collection.</p></header>
    {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>}{error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
    <div className="grid gap-5 xl:grid-cols-[minmax(320px,0.85fr)_minmax(0,1.15fr)]">
      <Card className="h-fit p-5 sm:p-6"><CardHeader title={editing ? 'Edit campaign' : 'Create campaign'} subtitle="Images should be compressed WebP or JPEG and hosted on this site or your chosen media service." action={editing ? <button className="text-xs text-neutral-500" onClick={() => { setEditing(null); setForm(EMPTY); }}>Cancel</button> : null}/>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className={labelClass}>Campaign title<input required maxLength={120} className={inputClass} value={form.title} onChange={set('title')} placeholder="A new season, thoughtfully made" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Placement<select className={inputClass} value={form.placement} onChange={set('placement')}><option value="hero">Homepage hero</option><option value="announcement">Announcement bar</option><option value="home_feature">Homepage feature</option></select></label><label className={labelClass}>Status<select className={inputClass} value={form.status} onChange={set('status')}><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label></div>
          <label className={labelClass}>Eyebrow<input maxLength={100} className={inputClass} value={form.eyebrow || ''} onChange={set('eyebrow')} placeholder="New collection" /></label>
          <label className={labelClass}>Campaign message<textarea maxLength={4000} rows={3} className={`${inputClass} h-auto py-3`} value={form.body || ''} onChange={set('body')} placeholder="Add clear, verified promotional copy." /></label>
          <label className={labelClass}>Desktop campaign image<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>uploadImage(event, 'imageUrl')} className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-xs file:font-medium dark:file:bg-white/10"/><input className={inputClass} value={form.imageUrl || ''} onChange={set('imageUrl')} placeholder="Or paste an image path: /uploads/campaigns/…" /></label>
          <label className={labelClass}>Mobile image (optional)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event)=>uploadImage(event, 'mobileImageUrl')} className="block w-full text-xs file:mr-3 file:rounded-full file:border-0 file:bg-neutral-100 file:px-4 file:py-2 file:text-xs file:font-medium dark:file:bg-white/10"/><input className={inputClass} value={form.mobileImageUrl || ''} onChange={set('mobileImageUrl')} placeholder="Leave blank to use desktop image" /></label>
          <label className={labelClass}>Image description<input maxLength={200} className={inputClass} value={form.imageAlt || ''} onChange={set('imageAlt')} placeholder="Gold necklace displayed on a dark surface" /></label>
          <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Button label<input maxLength={60} className={inputClass} value={form.ctaLabel || ''} onChange={set('ctaLabel')} /></label><label className={labelClass}>Button destination<input className={inputClass} value={form.ctaUrl || ''} onChange={set('ctaUrl')} placeholder="/shop" /></label></div>
          <div className="grid gap-4 sm:grid-cols-2"><label className={labelClass}>Starts at (optional)<input type="datetime-local" className={inputClass} value={form.startsAt || ''} onChange={set('startsAt')} /></label><label className={labelClass}>Ends at (optional)<input type="datetime-local" className={inputClass} value={form.endsAt || ''} onChange={set('endsAt')} /></label></div>
          <label className={labelClass}>Display priority<input type="number" step="1" className={inputClass} value={form.priority ?? 0} onChange={set('priority')} /></label>
          <button disabled={saving} className="flex h-11 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950">{saving ? 'Saving…' : <><Plus className="h-4 w-4"/>{editing ? 'Save changes' : 'Save campaign'}</>}</button>
        </form>
      </Card>
      <Card className="overflow-hidden"><div className="border-b border-neutral-100 p-5 dark:border-white/10"><CardHeader title="Campaign library" subtitle="Only published campaigns inside their schedule are shown publicly." action={<button aria-label="Refresh campaigns" onClick={load} className="rounded-full border border-neutral-200 p-2 text-neutral-500 hover:bg-neutral-50 dark:border-white/10 dark:hover:bg-white/5"><RefreshCw className="h-4 w-4"/></button>}/></div>
        {loading ? <div className="space-y-3 p-5">{[0,1,2].map((x)=><Skeleton key={x} className="h-24"/>)}</div> : items.length ? <ul className="divide-y divide-neutral-100 dark:divide-white/10">{items.map((item)=><li key={item.id} className="flex gap-4 p-5"><div className="grid h-16 w-20 shrink-0 place-items-center overflow-hidden rounded-xl bg-neutral-100 dark:bg-white/5">{item.imageUrl ? <img src={item.imageUrl} alt="" className="h-full w-full object-cover"/> : <Megaphone className="h-5 w-5 text-neutral-400"/>}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-semibold text-neutral-900 dark:text-white">{item.title}</p><Badge tone={item.status === 'published' ? 'success' : 'neutral'}>{item.status}</Badge></div><p className="mt-1 text-xs capitalize text-neutral-500">{item.placement.replace('_',' ')}{item.startsAt ? ` · starts ${new Date(item.startsAt).toLocaleString()}` : ''}</p><div className="mt-3 flex gap-3 text-xs font-medium"><button onClick={()=>edit(item)} className="text-teal-700 hover:underline dark:text-teal-300">Edit</button><button onClick={()=>remove(item)} className="inline-flex items-center gap-1 text-red-600 hover:underline"><Trash2 className="h-3.5 w-3.5"/>Delete</button></div></div></li>)}</ul> : <p className="px-5 py-14 text-center text-sm text-neutral-500">No campaigns yet. Create a draft and preview its image before publishing.</p>}
      </Card>
    </div>
  </div>;
}
