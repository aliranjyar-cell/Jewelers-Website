import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { adminCustomRequests } from '../../lib/api.js';
import { formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, CardHeader, Skeleton } from './dashboard/components/ui.jsx';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const TONES = { submitted: 'warning', reviewing: 'warning', quoted: 'info', approved: 'success', rejected: 'danger', converted: 'success' };
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function Detail({ label: title, value }) { return <div><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{title}</p><p className="mt-1 text-sm text-neutral-700 dark:text-neutral-300">{value || '—'}</p></div>; }

export default function CustomRequestDetailPage() {
  const { requestId } = useParams();
  const [request, setRequest] = useState(null);
  const [form, setForm] = useState({ status: 'reviewing', quote: '', sellerNote: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const record = await adminCustomRequests.get(requestId);
      setRequest(record);
      setForm({ status: record.status, quote: record.quote ?? '', sellerNote: record.sellerNote || '' });
      setError('');
    } catch (failure) { setError(failure.message || 'The custom request could not be loaded.'); }
    finally { setLoading(false); }
  }, [requestId]);
  useEffect(() => { load(); }, [load]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setNotice('');
    try { await adminCustomRequests.update(request.id, { ...form, quote: form.quote === '' ? null : Number(form.quote) }); await load(); setNotice('Request updated.'); }
    catch (failure) { setError(failure.message || 'The request could not be updated.'); }
    finally { setSaving(false); }
  }

  if (loading && !request) return <div className="space-y-4"><Skeleton className="h-24"/><Skeleton className="h-72"/></div>;
  if (error && !request) return <div className="space-y-4"><Link to="/admin/custom-requests" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4"/>All requests</Link><p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p></div>;
  if (!request) return null;
  const readOnly = ['approved', 'converted'].includes(request.status);
  const image = request.referenceImage;
  const imageUrl = image ? (image.startsWith('/') ? `${API_BASE}${image}` : image) : '';
  const allowedStatuses = request.status === 'submitted' ? ['submitted', 'reviewing', 'rejected']
    : request.status === 'reviewing' ? ['reviewing', 'quoted', 'rejected']
      : request.status === 'quoted' ? ['quoted', 'reviewing', 'rejected']
        : request.status === 'rejected' ? ['rejected', 'reviewing'] : [];

  return <div className="space-y-5 pb-8">
    <Link to="/admin/custom-requests" className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="h-4 w-4"/>All custom requests</Link>
    <header className="flex flex-wrap items-center justify-between gap-4 rounded-3xl bg-white p-5 ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10 sm:p-6"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Custom design inquiry</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{request.requestNumber}</h1><p className="mt-1 text-sm text-neutral-500">Received {dateTime(request.createdAt)} · Updated {dateTime(request.updatedAt)}</p></div><Badge tone={TONES[request.status] || 'neutral'}>{label(request.status)}</Badge></header>
    {notice && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</p>}{error && request && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.8fr)]">
      <div className="space-y-5">
        <Card className="p-5 sm:p-6"><CardHeader title="Request details" subtitle="Customer-submitted details for review."/><p className="mt-5 whitespace-pre-wrap text-sm leading-7 text-neutral-700 dark:text-neutral-300">{request.description}</p><div className="mt-5 grid gap-4 border-t border-neutral-100 pt-4 dark:border-white/10 sm:grid-cols-2"><Detail label="Category" value={request.category}/><Detail label="Preferred metal" value={request.requestedMetal}/><Detail label="Purity" value={request.requestedPurity}/><Detail label="Estimated weight" value={request.estimatedWeight != null ? `${request.estimatedWeight} g` : null}/></div>{imageUrl ? <a href={imageUrl} target="_blank" rel="noreferrer" className="mt-5 flex w-fit items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"><ImageIcon className="h-4 w-4"/>Open reference image</a> : <p className="mt-5 text-xs text-neutral-400">No reference image was attached.</p>}</Card>
        <Card className="p-5 sm:p-6"><CardHeader title="Activity history" subtitle="Staff updates and quote history."/><ol className="mt-5 space-y-4">{request.events.length ? request.events.map((event) => <li key={event.id} className="relative border-l border-neutral-200 pl-4 dark:border-white/10"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-teal-600 ring-4 ring-white dark:ring-[#141416]"/><p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{label(event.type)}{event.fromValue && event.toValue && event.fromValue !== event.toValue ? ` · ${label(event.fromValue)} → ${label(event.toValue)}` : ''}{event.quote != null ? ` · ${formatPKR(event.quote)}` : ''}</p>{event.note && <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">{event.note}</p>}<p className="mt-1 text-[11px] text-neutral-400">{event.actorName || 'Administrator'} · {dateTime(event.createdAt)}</p></li>) : <li className="text-sm text-neutral-500">No staff updates have been recorded.</li>}</ol></Card>
      </div>

      <aside className="space-y-5">
        <Card className="p-5 sm:p-6"><CardHeader title="Customer"/><div className="mt-4 grid gap-4"><Detail label="Name" value={request.customer}/><Detail label="Email" value={request.email}/><Detail label="Phone" value={request.phone}/></div></Card>
        <Card className="p-5 sm:p-6"><CardHeader title="Review and quote" subtitle={readOnly ? 'This request is already in a customer-approved or converted state.' : 'Saving a quote records it for staff follow-up.'}/>
          <form onSubmit={submit} className="mt-5 space-y-4">
            <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Request status<select disabled={readOnly} value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200">{allowedStatuses.map((status) => <option key={status} value={status}>{label(status)}</option>)}</select></label>
            <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Quote (PKR)<input disabled={readOnly} type="number" min="0.01" step="0.01" value={form.quote} onChange={(event) => setForm((current) => ({ ...current, quote: event.target.value }))} placeholder="Add a quote when ready" className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Seller note / reply<textarea disabled={readOnly} rows={5} maxLength={3000} value={form.sellerNote} onChange={(event) => setForm((current) => ({ ...current, sellerNote: event.target.value }))} placeholder="Add design feedback, quote details, or next steps." className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            {!readOnly && <button disabled={saving} className="h-10 w-full rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950">{saving ? 'Saving…' : 'Save request update'}</button>}
          </form>
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">A quote saved here is for staff follow-up. This screen does not send a customer notification or convert the request into an order.</p>
        </Card>
      </aside>
    </div>
  </div>;
}
