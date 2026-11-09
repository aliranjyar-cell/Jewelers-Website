import { useCallback, useEffect, useState } from 'react';
import { Badge, Card, CardHeader, Skeleton } from './dashboard/components/ui.jsx';
import { formatDateTime, formatPKR } from './dashboard/utils/format.js';
import { adminMetalRates } from '../../lib/api.js';

const METALS = ['gold', 'silver'];

export default function MetalRatesPage() {
  const [rates, setRates] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ metal: 'gold', purity: '22K', rate: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [current, past] = await Promise.all([adminMetalRates.list(), adminMetalRates.history(30)]);
      setRates(current.items || []); setHistory(past.items || []); setError('');
    } catch (failure) { setError(failure.message || 'Metal rates could not be loaded.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      await adminMetalRates.publish({ ...form, rate: Number(form.rate) });
      setMessage(`${form.metal === 'gold' ? 'Gold' : 'Silver'} ${form.purity} rate published.`);
      setForm((current) => ({ ...current, rate: '' }));
      await load();
    } catch (failure) { setError(failure.message || 'The rate could not be published.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6 pb-8">
    <header className="pt-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Pricing</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Metal rates</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Publish a new price per gram. Each update is kept in the rate history and used for future rate-based pricing.</p></header>

    {message && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{message}</p>}
    {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}

    <div className="grid gap-5 xl:grid-cols-[minmax(300px,0.8fr)_minmax(0,1.2fr)]">
      <Card className="h-fit p-5 sm:p-6">
        <CardHeader title="Publish a rate" subtitle="Rates are saved as a dated record; previous rates remain available."/>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Metal<select value={form.metal} onChange={(event) => setForm((current) => ({ ...current, metal: event.target.value }))} className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200">{METALS.map((metal) => <option key={metal} value={metal}>{metal[0].toUpperCase() + metal.slice(1)}</option>)}</select></label>
          <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Purity<input required value={form.purity} onChange={(event) => setForm((current) => ({ ...current, purity: event.target.value }))} maxLength={40} placeholder="e.g. 22K, 24K, 925" className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
          <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Rate per gram (PKR)<input required type="number" min="0.01" step="0.01" value={form.rate} onChange={(event) => setForm((current) => ({ ...current, rate: event.target.value }))} placeholder="0.00" className="h-11 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
          <button type="submit" disabled={saving || !form.rate || !form.purity.trim()} className="h-11 w-full rounded-full bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950">{saving ? 'Publishing…' : 'Publish rate'}</button>
        </form>
      </Card>

      <Card className="overflow-hidden">
        <div className="border-b border-neutral-100 p-5 dark:border-white/10"><CardHeader title="Current published rates" subtitle="The latest effective rate for each metal purity." action={<button type="button" onClick={load} className="rounded-full border border-neutral-200 px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5">Refresh</button>}/></div>
        {loading ? <div className="space-y-3 p-5">{[0, 1, 2].map((item) => <Skeleton key={item} className="h-14"/>)}</div> : rates.length ? <ul className="divide-y divide-neutral-100 dark:divide-white/10">{rates.map((rate) => <li key={rate.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4"><div className="flex items-center gap-3"><span className="grid h-10 w-12 place-items-center rounded-xl bg-neutral-100 text-xs font-semibold uppercase text-neutral-700 dark:bg-white/10 dark:text-neutral-200">{rate.purity}</span><div><p className="text-sm font-semibold capitalize text-neutral-900 dark:text-white">{rate.metal}</p><p className="mt-0.5 text-xs text-neutral-400">Updated {formatDateTime(rate.updatedAt)}{rate.updatedBy ? ` · ${rate.updatedBy}` : ''}</p></div></div><div className="text-right"><p className="text-sm font-semibold text-neutral-900 dark:text-white">{formatPKR(rate.rate)}<span className="ml-1 text-xs font-normal text-neutral-400">/ gram</span></p><Badge tone="success">Published</Badge></div></li>)}</ul> : <p className="px-5 py-12 text-center text-sm text-neutral-500">No metal rates published yet.</p>}
      </Card>
    </div>

    <Card className="overflow-hidden"><div className="border-b border-neutral-100 p-5 dark:border-white/10"><CardHeader title="Rate history" subtitle="Recent published changes across metals and purities."/></div><div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left text-sm"><thead className="bg-neutral-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:bg-white/[0.025]"><tr><th className="px-5 py-3">Metal</th><th className="px-5 py-3">Purity</th><th className="px-5 py-3">Rate per gram</th><th className="px-5 py-3">Effective</th><th className="px-5 py-3">Published by</th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-white/10">{history.map((rate) => <tr key={rate.id}><td className="px-5 py-3.5 capitalize text-neutral-700 dark:text-neutral-300">{rate.metal}</td><td className="px-5 py-3.5 text-neutral-700 dark:text-neutral-300">{rate.purity}</td><td className="px-5 py-3.5 font-semibold text-neutral-900 dark:text-white">{formatPKR(rate.rate)}</td><td className="px-5 py-3.5 text-neutral-500">{formatDateTime(rate.updatedAt)}</td><td className="px-5 py-3.5 text-neutral-500">{rate.updatedBy || '—'}</td></tr>)}{!loading && !history.length && <tr><td colSpan={5} className="px-5 py-10 text-center text-sm text-neutral-500">Rate history will appear here.</td></tr>}</tbody></table></div></Card>
  </div>;
}
