import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Boxes, Check, ChevronLeft, ChevronRight, ClipboardList, History, LoaderCircle, Package, PackageCheck, Pencil, Plus, Search, X } from 'lucide-react';
import { adminInventory } from '../../lib/api.js';
import { formatDateTime, formatNumber } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const imageUrl = (src) => !src ? '' : src.startsWith('/') ? `${API_BASE}${src}` : src;
const FILTERS = [['all', 'All variants'], ['low', 'Low stock'], ['out', 'Out of stock'], ['unavailable', 'Unavailable'], ['made_to_order', 'Made to order']];
const MOVEMENT_LABELS = { opening: 'Opening balance', receipt: 'Stock received', adjustment: 'Count adjustment', return: 'Customer return', reserve: 'Order reserved', release: 'Reservation released', fulfill: 'Order fulfilled' };

function Metric({ icon: Icon, label, value, detail, tone = 'default' }) {
  return <Card className="flex items-start gap-3 p-4 sm:p-5"><span className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl ${tone === 'warning' ? 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300' : 'bg-neutral-100 text-neutral-700 dark:bg-white/10 dark:text-neutral-200'}`}><Icon className="h-[18px] w-[18px]" /></span><div className="min-w-0"><p className="text-xs font-medium text-neutral-500 dark:text-neutral-400">{label}</p><p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-neutral-950 dark:text-white">{formatNumber(value)}</p>{detail && <p className="mt-0.5 text-[11px] text-neutral-400">{detail}</p>}</div></Card>;
}

export default function InventoryPage() {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState('stock');
  const [filter, setFilter] = useState(() => ['low', 'out', 'unavailable', 'made_to_order'].includes(searchParams.get('filter')) ? searchParams.get('filter') : 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 25, summary: null });
  const [movements, setMovements] = useState({ items: [], total: 0, pageSize: 30 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeItem, setActiveItem] = useState(null);
  const [action, setAction] = useState('receive');
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({ quantity: '', countedQuantity: '', reason: 'New purchase', note: '', reorderPoint: 3, type: 'receipt' });

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    const params = { page, pageSize: view === 'stock' ? 25 : 30, search };
    const request = view === 'stock'
      ? adminInventory.list({ ...params, filter })
      : adminInventory.movements(params);
    request.then((result) => {
      if (!active) return;
      if (view === 'stock') setData(result);
      else setMovements(result);
    }).catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [view, filter, search, page, revision]);

  useEffect(() => {
    if (!activeItem) return undefined;
    const handleKey = (event) => { if (event.key === 'Escape' && !saving) setActiveItem(null); };
    window.addEventListener('keydown', handleKey);
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', handleKey); document.body.style.overflow = oldOverflow; };
  }, [activeItem, saving]);

  const pageSize = view === 'stock' ? data.pageSize : movements.pageSize;
  const total = view === 'stock' ? data.total : movements.total;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  function beginAction(item, nextAction) {
    setActiveItem(item);
    setAction(nextAction);
    setFormError('');
    setForm({ quantity: '', countedQuantity: String(item.onHand), reason: nextAction === 'adjust' ? 'Stock count correction' : nextAction === 'return' ? 'Customer return' : 'New purchase', note: '', reorderPoint: item.reorderPoint, type: nextAction === 'return' ? 'return' : 'receipt' });
  }

  async function submitAction(event) {
    event.preventDefault();
    if (!activeItem) return;
    setSaving(true); setFormError('');
    try {
      if (action === 'receive' || action === 'return') {
        await adminInventory.receive(activeItem.variantId, { quantity: Number(form.quantity), type: action === 'return' ? 'return' : form.type, reason: form.reason, note: form.note, reorderPoint: Number(form.reorderPoint) });
      } else if (action === 'adjust') {
        await adminInventory.adjust(activeItem.variantId, { countedQuantity: Number(form.countedQuantity), reason: form.reason, note: form.note, reorderPoint: Number(form.reorderPoint) });
      } else {
        await adminInventory.setReorderPoint(activeItem.variantId, Number(form.reorderPoint));
      }
      setActiveItem(null);
      setRevision((value) => value + 1);
    } catch (failure) { setFormError(failure.message); }
    finally { setSaving(false); }
  }

  const activeTitle = useMemo(() => activeItem ? `${activeItem.productName} · ${activeItem.optionLabel || activeItem.sku}` : '', [activeItem]);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Stock control</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Inventory</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Receive stock, record counts and follow every change by variant.</p></div>
        <div className="flex rounded-full bg-neutral-100 p-1 dark:bg-white/5" role="tablist" aria-label="Inventory view"><button type="button" role="tab" aria-selected={view === 'stock'} onClick={() => { setView('stock'); setPage(1); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${view === 'stock' ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'}`}><Boxes className="h-3.5 w-3.5" /> Stock</button><button type="button" role="tab" aria-selected={view === 'history'} onClick={() => { setView('history'); setPage(1); }} className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium ${view === 'history' ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'}`}><History className="h-3.5 w-3.5" /> Activity history</button></div>
      </div>

      {view === 'stock' && <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5"><Metric icon={Boxes} label="Product variants" value={data.summary?.variants || 0} detail="Sellable options" /><Metric icon={Package} label="Units on hand" value={data.summary?.units || 0} detail="Physical stock count" /><Metric icon={ClipboardList} label="Reserved for orders" value={data.summary?.reserved || 0} detail="Unavailable for new orders" /><Metric icon={AlertTriangle} label="Low stock" value={data.summary?.lowStock || 0} detail="At or below reorder point" tone="warning" /><Metric icon={PackageCheck} label="Out of stock" value={data.summary?.outOfStock || 0} detail={`${formatNumber(data.summary?.madeToOrder || 0)} made to order excluded`} tone="warning" /></div>}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder={view === 'stock' ? 'Search product, variant or SKU' : 'Search movement history'} className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-9 pr-4 text-sm outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#141416]" /></label>
          {view === 'stock' && <div className="flex gap-1 overflow-x-auto rounded-full bg-neutral-100 p-1 dark:bg-white/5">{FILTERS.map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => { setFilter(value); setPage(1); }} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium ${filter === value ? 'bg-neutral-950 text-white dark:bg-white dark:text-neutral-950' : 'text-neutral-500 dark:text-neutral-400'}`}>{label}</button>)}</div>}
        </div>

        {error && <div role="alert" className="m-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
        {view === 'stock' ? <StockTable items={data.items} loading={loading} onAction={beginAction} /> : <MovementTable items={movements.items} loading={loading} />}

        <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400"><span>{loading ? 'Loading…' : `${formatNumber(total)} ${view === 'stock' ? 'variants' : 'movements'}`}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-3 w-3" /> Previous</button><span>Page {page} of {totalPages}</span><button type="button" disabled={page >= totalPages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10">Next <ChevronRight className="h-3 w-3" /></button></div></div>
      </Card>

      {activeItem && <InventoryDialog item={activeItem} title={activeTitle} action={action} form={form} setForm={setForm} saving={saving} error={formError} onClose={() => !saving && setActiveItem(null)} onSubmit={submitAction} />}
    </div>
  );
}

function StockTable({ items, loading, onAction }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:bg-white/[0.025] dark:text-neutral-500"><tr><th className="px-5 py-3">Product / variant</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">On hand</th><th className="px-4 py-3 text-right">Reserved</th><th className="px-4 py-3 text-right">Available</th><th className="px-4 py-3 text-right">Reorder at</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-white/5">{loading ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={7} className="px-5 py-4"><Skeleton className="h-12 w-full" /></td></tr>) : items.map((item) => <StockRow key={item.variantId} item={item} onAction={onAction} />)}{!loading && items.length === 0 && <tr><td colSpan={7} className="px-6 py-16 text-center"><Package className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600" /><p className="mt-3 font-semibold text-neutral-800 dark:text-neutral-200">No inventory items found</p><p className="mt-1 text-sm text-neutral-500">Add a product variant or change the filters.</p><Link to="/admin/products" className="mt-4 inline-flex rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-neutral-950">View products</Link></td></tr>}</tbody></table></div>;
}

function StockRow({ item, onAction }) {
  const low = item.availability === 'available' && item.onHand > 0 && item.onHand <= item.reorderPoint;
  const out = item.availability === 'available' && item.onHand === 0;
  const status = item.availability === 'made_to_order' ? ['Made to order', 'info'] : item.availability === 'unavailable' ? ['Unavailable', 'neutral'] : out ? ['Out of stock', 'danger'] : low ? ['Low stock', 'warning'] : ['In stock', 'success'];
  return <tr className="transition hover:bg-neutral-50/70 dark:hover:bg-white/[0.025]"><td className="px-5 py-3.5"><div className="flex items-center gap-3">{item.image ? <img src={imageUrl(item.image)} alt="" className="h-11 w-11 rounded-xl bg-neutral-100 object-cover dark:bg-white/10" /> : <span className="grid h-11 w-11 place-items-center rounded-xl bg-neutral-100 text-neutral-400 dark:bg-white/10"><Package className="h-4 w-4" /></span>}<div className="min-w-0"><Link to={`/admin/products/${item.productId}/edit`} className="block max-w-xs truncate font-semibold text-neutral-950 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">{item.productName}</Link><p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{item.optionLabel || 'Default'} · SKU {item.sku}</p></div></div></td><td className="px-4 py-3.5"><Badge tone={status[1]}>{status[0]}</Badge></td><td className="px-4 py-3.5 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatNumber(item.onHand)}</td><td className="px-4 py-3.5 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{formatNumber(item.reserved)}</td><td className="px-4 py-3.5 text-right font-semibold tabular-nums text-neutral-900 dark:text-neutral-100">{formatNumber(item.available)}</td><td className="px-4 py-3.5 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{formatNumber(item.reorderPoint)}</td><td className="px-5 py-3.5"><div className="flex justify-end gap-1"><button type="button" onClick={() => onAction(item, 'receive')} className="inline-flex h-8 items-center gap-1 rounded-full bg-teal-700/10 px-3 text-[11px] font-semibold text-teal-800 transition hover:bg-teal-700/15 dark:text-teal-200"><ArrowDownToLine className="h-3.5 w-3.5" /> Receive</button><button type="button" onClick={() => onAction(item, 'adjust')} aria-label={`Adjust stock for ${item.productName} ${item.optionLabel || ''}`} className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-white/10 dark:hover:text-white"><Pencil className="h-3.5 w-3.5" /></button><button type="button" onClick={() => onAction(item, 'threshold')} aria-label={`Edit reorder point for ${item.productName}`} className="grid h-8 w-8 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-white/10 dark:hover:text-white"><AlertTriangle className="h-3.5 w-3.5" /></button></div></td></tr>;
}

function MovementTable({ items, loading }) {
  return <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:bg-white/[0.025] dark:text-neutral-500"><tr><th className="px-5 py-3">Activity</th><th className="px-4 py-3">Product / SKU</th><th className="px-4 py-3 text-right">On-hand change</th><th className="px-4 py-3 text-right">Reserved change</th><th className="px-4 py-3">Reason</th><th className="px-5 py-3 text-right">When / who</th></tr></thead><tbody className="divide-y divide-neutral-100 dark:divide-white/5">{loading ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={6} className="px-5 py-4"><Skeleton className="h-10 w-full" /></td></tr>) : items.map((item) => <tr key={item.id}><td className="px-5 py-3.5"><Badge tone={item.type === 'receipt' || item.type === 'return' || item.type === 'opening' ? 'success' : item.type === 'adjustment' ? 'warning' : 'info'}>{MOVEMENT_LABELS[item.type] || item.type}</Badge></td><td className="px-4 py-3.5"><p className="font-medium text-neutral-900 dark:text-neutral-100">{item.productName}</p><p className="mt-0.5 text-xs text-neutral-500">{item.sku}{item.orderId ? ` · Order ${item.orderId}` : ''}</p></td><td className={`px-4 py-3.5 text-right font-semibold tabular-nums ${item.onHandChange > 0 ? 'text-emerald-700 dark:text-emerald-300' : item.onHandChange < 0 ? 'text-red-600 dark:text-red-400' : 'text-neutral-400'}`}>{item.onHandChange > 0 ? '+' : ''}{formatNumber(item.onHandChange)}</td><td className="px-4 py-3.5 text-right tabular-nums text-neutral-600 dark:text-neutral-300">{item.reservedChange > 0 ? '+' : ''}{formatNumber(item.reservedChange)}</td><td className="max-w-xs px-4 py-3.5"><p className="truncate text-neutral-800 dark:text-neutral-200">{item.reason}</p>{item.note && <p className="mt-0.5 truncate text-xs text-neutral-400">{item.note}</p>}</td><td className="px-5 py-3.5 text-right"><p className="text-xs text-neutral-700 dark:text-neutral-300">{formatDateTime(item.createdAt)}</p><p className="mt-0.5 text-[11px] text-neutral-400">{item.performedBy || 'System'}</p></td></tr>)}{!loading && !items.length && <tr><td colSpan={6} className="px-6 py-16 text-center"><History className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600" /><p className="mt-3 font-semibold text-neutral-800 dark:text-neutral-200">No stock activity yet</p><p className="mt-1 text-sm text-neutral-500">Receipts, adjustments and order reservations will appear here.</p></td></tr>}</tbody></table></div>;
}

function InventoryDialog({ item, title, action, form, setForm, saving, error, onClose, onSubmit }) {
  const isReceive = action === 'receive' || action === 'return';
  const actionTitle = action === 'receive' ? 'Receive stock' : action === 'return' ? 'Record a return' : action === 'adjust' ? 'Record a stock count' : 'Set reorder point';
  return <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="presentation"><button type="button" aria-label="Close inventory dialog" onClick={onClose} className="absolute inset-0 bg-neutral-950/60 backdrop-blur-sm" /><section role="dialog" aria-modal="true" aria-labelledby="inventory-dialog-title" className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-neutral-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#141416]"><header className="flex items-start justify-between gap-4 border-b border-neutral-100 p-5 dark:border-white/10"><div><p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-teal-700 dark:text-teal-300">Inventory transaction</p><h2 id="inventory-dialog-title" className="mt-1 text-lg font-semibold text-neutral-950 dark:text-white">{actionTitle}</h2><p className="mt-1 max-w-sm truncate text-xs text-neutral-500">{title} · {item.sku}</p></div><button type="button" onClick={onClose} aria-label="Close" className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 dark:hover:bg-white/10"><X className="h-4 w-4" /></button></header>
    <form onSubmit={onSubmit} className="space-y-4 p-5">
      {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-xs text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      {action === 'receive' && <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Stock activity<select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value, reason: event.target.value === 'return' ? 'Customer return' : 'New purchase' }))} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101012]"><option value="receipt">New stock received</option><option value="return">Customer return</option></select></label>}
      {isReceive ? <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Quantity received *<input autoFocus required type="number" min="1" step="1" value={form.quantity} onChange={(event) => setForm((current) => ({ ...current, quantity: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101012]" /></label> : action === 'adjust' ? <><div className="grid grid-cols-2 gap-3"><div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]"><p className="text-[10px] text-neutral-400">Current on hand</p><p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{formatNumber(item.onHand)}</p></div><div className="rounded-xl bg-neutral-50 p-3 dark:bg-white/[0.04]"><p className="text-[10px] text-neutral-400">Reserved for orders</p><p className="mt-1 text-lg font-semibold text-neutral-900 dark:text-white">{formatNumber(item.reserved)}</p></div></div><label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Counted physical quantity *<input autoFocus required type="number" min={item.reserved} step="1" value={form.countedQuantity} onChange={(event) => setForm((current) => ({ ...current, countedQuantity: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101012]" /><span className="mt-1 block font-normal text-neutral-400">Must be at least the reserved quantity.</span></label></> : null}
      {action !== 'threshold' && <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Reason *<select required value={form.reason} onChange={(event) => setForm((current) => ({ ...current, reason: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101012]">{(isReceive ? ['New purchase', 'Customer return', 'Transfer in', 'Opening balance', 'Other'] : ['Stock count correction', 'Damaged or lost', 'Found stock', 'Other']).map((reason) => <option key={reason}>{reason}</option>)}</select></label>}
      <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Reorder point<input required type="number" min="0" step="1" value={form.reorderPoint} onChange={(event) => setForm((current) => ({ ...current, reorderPoint: event.target.value }))} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm dark:border-white/10 dark:bg-[#101012]" /><span className="mt-1 block font-normal text-neutral-400">Show a low-stock alert when available stock reaches this level.</span></label>
      {action !== 'threshold' && <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-200">Note (optional)<textarea maxLength={500} rows={2} value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} placeholder="Invoice number, count details, or context" className="mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#101012]" /></label>}
      <div className="flex justify-end gap-2 border-t border-neutral-100 pt-4 dark:border-white/10"><button type="button" onClick={onClose} disabled={saving} className="h-10 rounded-full px-4 text-xs font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 dark:hover:bg-white/5">Cancel</button><button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-neutral-950">{saving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : action === 'receive' || action === 'return' ? <ArrowDownToLine className="h-3.5 w-3.5" /> : action === 'adjust' ? <ArrowUpFromLine className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}{saving ? 'Saving…' : action === 'receive' || action === 'return' ? 'Record stock' : action === 'adjust' ? 'Save count' : 'Save threshold'}</button></div>
    </form>
  </section></div>;
}
