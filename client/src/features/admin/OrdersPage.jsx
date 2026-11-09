import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowDownUp, ChevronLeft, ChevronRight, Search, ShoppingBag } from 'lucide-react';
import { adminOrders } from '../../lib/api.js';
import { formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const ORDER_TONE = { placed: 'info', pending_payment: 'warning', confirmed: 'accent', processing: 'warning', shipped: 'info', delivered: 'success', cancelled: 'danger', refunded: 'neutral' };
const PAYMENT_TONE = { unpaid: 'warning', pending: 'info', paid: 'success', failed: 'danger', refunded: 'neutral' };
const ORDER_STATUSES = ['placed', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];
const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'failed', 'refunded'];
const label = (value) => String(value || 'unknown').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';

function Filter({ label: title, value, onChange, children }) {
  return <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400"><span>{title}</span><select value={value} onChange={onChange} className="h-10 min-w-32 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium normal-case tracking-normal text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#141416] dark:text-neutral-100">{children}</select></label>;
}

export default function OrdersPage() {
  const [filters, setFilters] = useState({ search: '', status: '', paymentStatus: '', paymentMethod: '', dateFrom: '', dateTo: '', sort: 'newest' });
  const [range, setRange] = useState({ dateFrom: '', dateTo: '' });
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setLoading(true);
      adminOrders.list({ ...filters, page, pageSize: 20 })
        .then((result) => { if (active) { setData(result); setError(''); } })
        .catch((failure) => { if (active) setError(failure.message || 'Orders could not be loaded.'); })
        .finally(() => { if (active) setLoading(false); });
    }, filters.search ? 250 : 0);
    return () => { active = false; window.clearTimeout(timer); };
  }, [filters, page]);

  function setFilter(key, value) { setPage(1); setFilters((current) => ({ ...current, [key]: value })); }
  function applyDates(event) { event.preventDefault(); setPage(1); setFilters((current) => ({ ...current, ...range })); }
  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return <div className="space-y-6 pb-8">
    <header className="flex flex-col gap-3 pt-2 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Store operations</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Orders</h1><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Review purchases, confirm payments, and keep fulfillment moving.</p></div>
      <div className="rounded-2xl bg-white px-4 py-3 text-sm ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10"><span className="text-neutral-500">Matching orders</span><strong className="ml-3 text-neutral-950 dark:text-white">{loading ? '…' : data.total.toLocaleString()}</strong></div>
    </header>

    <Card className="overflow-hidden">
      <div className="space-y-4 border-b border-neutral-100 p-4 dark:border-white/10 sm:p-5">
        <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"/><input aria-label="Search orders" value={filters.search} onChange={(event) => setFilter('search', event.target.value)} placeholder="Order number, customer, phone, or email" className="h-11 w-full rounded-full border border-neutral-200 bg-white pl-10 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#101012]"/></div>
        <div className="flex flex-wrap items-end gap-3">
          <Filter label="Order status" value={filters.status} onChange={(event) => setFilter('status', event.target.value)}><option value="">All statuses</option>{ORDER_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</Filter>
          <Filter label="Payment" value={filters.paymentStatus} onChange={(event) => setFilter('paymentStatus', event.target.value)}><option value="">All payments</option>{PAYMENT_STATUSES.map((status) => <option key={status} value={status}>{label(status)}</option>)}</Filter>
          <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400"><span>Payment method</span><input value={filters.paymentMethod} onChange={(event) => setFilter('paymentMethod', event.target.value)} placeholder="Any method" className="h-10 w-36 rounded-xl border border-neutral-200 bg-white px-3 text-xs font-medium normal-case tracking-normal text-neutral-800 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#141416] dark:text-neutral-100"/></label>
          <Filter label="Sort by" value={filters.sort} onChange={(event) => setFilter('sort', event.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="total">Highest total</option></Filter>
          <form onSubmit={applyDates} className="flex flex-wrap items-end gap-2"><label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">From<input type="date" value={range.dateFrom} onChange={(event) => setRange((current) => ({ ...current, dateFrom: event.target.value }))} className="h-10 rounded-xl border border-neutral-200 bg-white px-2 text-xs text-neutral-700 dark:border-white/10 dark:bg-[#141416] dark:text-neutral-100"/></label><label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">To<input type="date" value={range.dateTo} onChange={(event) => setRange((current) => ({ ...current, dateTo: event.target.value }))} className="h-10 rounded-xl border border-neutral-200 bg-white px-2 text-xs text-neutral-700 dark:border-white/10 dark:bg-[#141416] dark:text-neutral-100"/></label><button className="h-10 rounded-full border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5">Apply dates</button></form>
        </div>
      </div>
      {error && <p role="alert" className="m-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[940px] text-left text-sm">
          <thead className="bg-neutral-50/80 text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400 dark:bg-white/[0.025]"><tr><th className="px-5 py-3">Order</th><th className="px-5 py-3">Customer</th><th className="px-5 py-3">Placed</th><th className="px-5 py-3">Items</th><th className="px-5 py-3">Total</th><th className="px-5 py-3">Payment</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3"/></tr></thead>
          <tbody className="divide-y divide-neutral-100 dark:divide-white/10">
            {loading && Array.from({ length: 5 }, (_, index) => <tr key={index}><td colSpan={9} className="px-5 py-3"><Skeleton className="h-8 w-full"/></td></tr>)}
            {!loading && data.items.map((order) => {
              const attention = ['placed', 'pending_payment'].includes(order.status) || ['unpaid', 'pending', 'failed'].includes(order.paymentStatus);
              return <tr key={order.id} className={`transition hover:bg-neutral-50/80 dark:hover:bg-white/[0.025] ${attention ? 'bg-amber-50/35 dark:bg-amber-400/[0.025]' : ''}`}>
                <td className="px-5 py-4"><Link to={`/admin/orders/${order.id}`} className="font-semibold text-neutral-950 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">#{order.orderNumber}</Link>{attention && <span className="ml-2 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" aria-label="Needs attention"/>}</td>
                <td className="px-5 py-4"><p className="font-medium text-neutral-800 dark:text-neutral-200">{order.customerName}</p><p className="mt-0.5 text-xs text-neutral-400">{order.customerPhone || order.recipientPhone || order.email || 'No contact details'}</p></td>
                <td className="whitespace-nowrap px-5 py-4 text-xs text-neutral-500">{dateTime(order.createdAt)}</td><td className="px-5 py-4 text-neutral-600 dark:text-neutral-300">{order.itemCount}</td><td className="whitespace-nowrap px-5 py-4 font-semibold text-neutral-800 dark:text-neutral-200">{formatPKR(order.total)}</td>
                <td className="px-5 py-4"><p className="text-xs text-neutral-500">{order.paymentMethod || '—'}</p><Badge tone={PAYMENT_TONE[order.paymentStatus]}>{label(order.paymentStatus)}</Badge></td><td className="px-5 py-4"><Badge tone={ORDER_TONE[order.status]}>{label(order.status)}</Badge></td><td className="whitespace-nowrap px-5 py-4 text-xs text-neutral-500">{dateTime(order.updatedAt)}</td><td className="px-5 py-4"><Link aria-label={`View order ${order.orderNumber}`} to={`/admin/orders/${order.id}`} className="inline-flex h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-600 transition hover:bg-white dark:border-white/10 dark:text-neutral-300 dark:hover:bg-white/5"><ArrowDownUp className="h-3.5 w-3.5"/>View</Link></td>
              </tr>;
            })}
            {!loading && !data.items.length && <tr><td colSpan={9} className="px-6 py-16 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600"/><p className="mt-3 font-semibold text-neutral-800 dark:text-neutral-200">No orders found</p><p className="mt-1 text-sm text-neutral-500">Try a different search or clear some filters.</p></td></tr>}
          </tbody>
        </table>
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 dark:border-white/10"><span>{data.total ? `${(page - 1) * data.pageSize + 1}–${Math.min(page * data.pageSize, data.total)} of ${data.total}` : 'No matching orders'}</span><div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10"><ChevronLeft className="h-3.5 w-3.5"/>Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="inline-flex items-center gap-1 rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10">Next<ChevronRight className="h-3.5 w-3.5"/></button></div></footer>
    </Card>
  </div>;
}
