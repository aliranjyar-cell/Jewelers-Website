import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Gem, Search } from 'lucide-react';
import { adminCustomRequests } from '../../lib/api.js';
import { formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const STATUSES = ['submitted', 'reviewing', 'quoted', 'approved', 'rejected', 'converted'];
const TONES = { submitted: 'warning', reviewing: 'warning', quoted: 'info', approved: 'success', rejected: 'danger', converted: 'success' };
const label = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

export default function CustomRequestsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      adminCustomRequests.list({ search, status, page, pageSize: 20 })
        .then((result) => { if (active) { setData(result); setError(''); } })
        .catch((failure) => { if (active) setError(failure.message || 'Custom requests could not be loaded.'); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [search, status, page]);

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));
  return <div className="space-y-6 pb-8">
    <header className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Customer care</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Custom requests</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Review design inquiries, prepare quotes, and track each request.</p></div><div className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10"><span className="text-neutral-500">Requests</span><strong className="ml-3 text-neutral-950 dark:text-white">{loading ? '…' : data.total.toLocaleString()}</strong></div></header>
    <Card className="overflow-hidden">
      <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5"><div className="relative w-full max-w-lg"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><input aria-label="Search custom requests" value={search} onChange={(event) => { setPage(1); setSearch(event.target.value); }} placeholder="Request number, customer, phone, or email" className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012]"/></div><label className="flex items-center gap-2 text-xs font-medium text-neutral-500">Status<select value={status} onChange={(event) => { setPage(1); setStatus(event.target.value); }} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-xs text-neutral-800 dark:border-white/10 dark:bg-[#141416] dark:text-neutral-100"><option value="">All requests</option>{STATUSES.map((item) => <option key={item} value={item}>{label(item)}</option>)}</select></label></div>
      {error && <p role="alert" className="m-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="bg-neutral-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:bg-white/[0.025]"><tr><th className="px-5 py-3">Request</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Design</th><th className="px-5 py-3">Quote</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Received</th><th className="px-5 py-3"/></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-white/10">
        {loading && [0, 1, 2, 3].map((index) => <tr key={index}><td colSpan={7} className="px-5 py-3"><Skeleton className="h-8 w-full"/></td></tr>)}
        {!loading && data.items.map((request) => <tr key={request.id} className={`hover:bg-neutral-50/70 dark:hover:bg-white/[0.025] ${['submitted', 'reviewing'].includes(request.status) ? 'bg-amber-50/30 dark:bg-amber-400/[0.02]' : ''}`}><td className="px-5 py-4"><Link to={`/admin/custom-requests/${request.id}`} className="font-semibold text-neutral-900 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">{request.requestNumber}</Link></td><td className="px-5 py-4"><p className="font-medium text-neutral-800 dark:text-neutral-200">{request.customer}</p><p className="mt-0.5 text-xs text-neutral-400">{request.phone || request.email || 'No contact details'}</p></td><td className="px-5 py-4 text-xs text-neutral-600 dark:text-neutral-300">{[request.requestedMetal, request.requestedPurity, request.estimatedWeight != null && `${request.estimatedWeight} g`].filter(Boolean).join(' · ') || 'See request'}</td><td className="px-5 py-4 text-neutral-700 dark:text-neutral-300">{request.quote == null ? 'Not quoted' : formatPKR(request.quote)}</td><td className="px-5 py-4"><Badge tone={TONES[request.status] || 'neutral'}>{label(request.status)}</Badge></td><td className="whitespace-nowrap px-5 py-4 text-xs text-neutral-500">{dateTime(request.createdAt)}</td><td className="px-5 py-4"><Link to={`/admin/custom-requests/${request.id}`} className="inline-flex h-9 items-center rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-600 hover:bg-white dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5">Review</Link></td></tr>)}
        {!loading && !data.items.length && <tr><td colSpan={7} className="px-6 py-16 text-center"><Gem className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600"/><p className="mt-3 font-semibold text-neutral-800 dark:text-neutral-200">No custom requests found</p><p className="mt-1 text-sm text-neutral-500">New customer inquiries will appear here.</p></td></tr>}
      </tbody></table></div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 dark:border-white/10"><span>{data.total ? `${(page - 1) * data.pageSize + 1}–${Math.min(page * data.pageSize, data.total)} of ${data.total}` : 'No requests'}</span><div className="flex items-center gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage((current) => current - 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-3.5 w-3.5"/>Previous</button><span>Page {page} of {pages}</span><button disabled={page >= pages || loading} onClick={() => setPage((current) => current + 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10">Next<ChevronRight className="h-3.5 w-3.5"/></button></div></footer>
    </Card>
  </div>;
}
