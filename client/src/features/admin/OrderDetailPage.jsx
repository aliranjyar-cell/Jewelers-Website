import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, Check, Clock3, CreditCard, MapPin, PackageCheck, RefreshCw, Truck, UserRound } from 'lucide-react';
import { adminOrders } from '../../lib/api.js';
import { formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/+$/, '');
const STATUS_TONE = { placed: 'info', pending_payment: 'warning', confirmed: 'accent', processing: 'warning', shipped: 'info', delivered: 'success', cancelled: 'danger', refunded: 'neutral' };
const PAYMENT_TONE = { unpaid: 'warning', pending: 'info', paid: 'success', failed: 'danger', refunded: 'neutral' };
const NEXT_STATUS = { pending_payment: ['placed', 'confirmed', 'cancelled'], placed: ['confirmed', 'cancelled'], confirmed: ['processing', 'cancelled'], processing: ['shipped', 'cancelled'], shipped: ['delivered'], delivered: ['refunded'], cancelled: ['refunded'] };
const title = (value) => String(value || '').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const dateTime = (value) => value ? new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : '—';
const money = (value) => formatPKR(Number(value || 0));

function Panel({ title: heading, icon: Icon, children, className = '' }) {
  return <Card className={`p-5 sm:p-6 ${className}`}><h2 className="flex items-center gap-2 text-sm font-semibold text-neutral-950 dark:text-white"><Icon className="h-4 w-4 text-teal-700 dark:text-teal-300"/>{heading}</h2><div className="mt-4">{children}</div></Card>;
}
function Field({ label, value }) { return <div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{label}</p><p className="mt-1 break-words text-sm text-neutral-700 dark:text-neutral-300">{value || '—'}</p></div>; }

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [actionError, setActionError] = useState('');
  const [reason, setReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [payment, setPayment] = useState({ status: '', provider: 'Manual', reference: '', note: '' });
  const [fulfillment, setFulfillment] = useState({ courier: '', tracking: '', internalNote: '' });

  const loadOrder = useCallback(async () => {
    setLoading(true);
    try {
      const record = await adminOrders.get(orderId);
      setOrder(record);
      setFulfillment({ courier: record.courier_name || '', tracking: record.tracking_number || '', internalNote: record.internal_note || '' });
      setError('');
    } catch (failure) { setError(failure.message || 'Order details could not be loaded.'); }
    finally { setLoading(false); }
  }, [orderId]);

  useEffect(() => { loadOrder(); }, [loadOrder]);

  const address = useMemo(() => {
    if (!order) return {};
    const raw = order.address || {};
    return typeof raw === 'string' ? (() => { try { return JSON.parse(raw); } catch { return {}; } })() : raw;
  }, [order]);

  async function runAction(action, success) {
    setBusy(true); setActionError(''); setNotice('');
    try { await action(); await loadOrder(); setNotice(success); setReason(''); setOverrideReason(''); }
    catch (failure) { setActionError(failure.message || 'The order could not be updated.'); }
    finally { setBusy(false); }
  }

  if (loading && !order) return <div className="space-y-4"><Skeleton className="h-28"/><Skeleton className="h-72"/></div>;
  if (error && !order) return <div className="space-y-4"><Link to="/admin/orders" className="inline-flex items-center gap-2 text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"><ArrowLeft className="h-4 w-4"/>All orders</Link><p role="alert" className="rounded-2xl bg-red-50 p-5 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p></div>;
  if (!order) return null;

  const nextStatuses = NEXT_STATUS[order.status] || [];
  const customerAddress = [address.address_line1 || address.line1 || address.street, address.address_line2 || address.line2, address.city, address.province || address.state, address.postal_code || address.postalCode].filter(Boolean).join(', ') || Object.values(address).filter((value) => typeof value === 'string' && value.trim()).join(', ') || 'No address snapshot saved.';
  const canEditFulfillment = ['confirmed', 'processing', 'shipped'].includes(order.status);
  const statusActionLabel = (status) => ({ confirmed: 'Confirm order · reserve stock', processing: 'Begin processing', shipped: 'Mark as shipped · deduct reserved stock', delivered: 'Mark as delivered', cancelled: 'Cancel order · release stock', refunded: 'Mark refunded', placed: 'Mark as placed' })[status] || `Set ${title(status)}`;

  return <div className="space-y-5 pb-8">
    <Link to="/admin/orders" className="inline-flex items-center gap-2 pt-2 text-sm font-medium text-neutral-500 transition hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="h-4 w-4"/>All orders</Link>
    <header className="flex flex-col gap-4 rounded-3xl bg-white p-5 ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-6">
      <div><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Order record</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">#{order.order_number}</h1><p className="mt-1 text-sm text-neutral-500">Placed {dateTime(order.created_at)} · Last updated {dateTime(order.updated_at)}</p></div>
      <div className="flex flex-wrap gap-2"><Badge tone={STATUS_TONE[order.status]}>{title(order.status)}</Badge><Badge tone={PAYMENT_TONE[order.payment_status]}>{title(order.payment_status)}</Badge></div>
    </header>
    {(notice || actionError) && <p role={actionError ? 'alert' : 'status'} className={`rounded-2xl px-4 py-3 text-sm ${actionError ? 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-300' : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300'}`}>{actionError || notice}</p>}

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.8fr)]">
      <div className="space-y-5">
        <Panel title="Items" icon={PackageCheck}>
          <div className="divide-y divide-neutral-100 dark:divide-white/10">{order.items.map((item) => <div key={item.id} className="flex gap-3 py-4 first:pt-0 last:pb-0"><div className="grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-100 text-xs text-neutral-400 dark:bg-white/5">{item.image ? <img src={item.image.startsWith('/') ? `${API_BASE}${item.image}` : item.image} alt="" className="h-full w-full object-cover"/> : 'Jewelry'}</div><div className="min-w-0 flex-1"><p className="font-semibold text-neutral-900 dark:text-white">{item.productName}</p><p className="mt-1 text-xs text-neutral-500">{[item.optionLabel, item.sku && `SKU ${item.sku}`, item.metalType, item.purity, item.weightGrams != null && `${item.weightGrams} g`].filter(Boolean).join(' · ') || 'Product snapshot'}</p><p className="mt-2 text-xs text-neutral-500">{item.quantity} × {money(item.unitPrice)}</p><p className="mt-1 text-[11px] text-neutral-400">Stock: {item.reservationStatus ? title(item.reservationStatus) : item.stockAvailability === 'made_to_order' ? 'Made to order' : item.stockAvailability ? title(item.stockAvailability) : 'Not tracked'}</p>{item.metalRate != null && <p className="mt-1 text-[11px] text-neutral-400">Saved metal rate {money(item.metalRate)}/g · making charge {money(item.makingCharge)}{item.makingChargeType ? ` (${item.makingChargeType.replace('_', ' ')})` : ''}</p>}</div><p className="shrink-0 text-sm font-semibold text-neutral-900 dark:text-white">{money(item.lineTotal)}</p></div>)}</div>
          <div className="mt-5 space-y-2 border-t border-neutral-100 pt-4 text-sm dark:border-white/10"><div className="flex justify-between text-neutral-500"><span>Items subtotal</span><span>{money(order.subtotal_pkr)}</span></div>{Number(order.discount_pkr) > 0 && <div className="flex justify-between text-neutral-500"><span>Discount</span><span>−{money(order.discount_pkr)}</span></div>}<div className="flex justify-between text-neutral-500"><span>Delivery</span><span>{money(order.delivery_fee_pkr)}</span></div><div className="flex justify-between border-t border-neutral-100 pt-3 text-base font-semibold text-neutral-950 dark:border-white/10 dark:text-white"><span>Total · PKR</span><span>{money(order.total_pkr)}</span></div></div>
        </Panel>

        <Panel title="Payment history" icon={CreditCard}>
          <div className="space-y-3">{order.payments.length ? order.payments.map((attempt) => <div key={attempt.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-neutral-50 px-4 py-3 dark:bg-white/[0.03]"><div><p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{attempt.provider}{attempt.reference ? ` · ${attempt.reference}` : ''}</p><p className="mt-1 text-xs text-neutral-400">Updated {dateTime(attempt.updatedAt)}</p></div><div className="flex items-center gap-3"><span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{money(attempt.amount)}</span><Badge tone={attempt.status === 'succeeded' ? 'success' : PAYMENT_TONE[attempt.status]}>{title(attempt.status === 'succeeded' ? 'paid' : attempt.status)}</Badge></div></div>) : <p className="text-sm text-neutral-500">No payment attempts have been recorded.</p>}</div>
          {order.payment_status !== 'refunded' && <form onSubmit={(event) => { event.preventDefault(); runAction(() => adminOrders.updatePayment(order.id, payment), 'Payment record saved.'); }} className="mt-5 grid gap-3 border-t border-neutral-100 pt-5 dark:border-white/10 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Record payment status<select required value={payment.status} onChange={(event) => setPayment((current) => ({ ...current, status: event.target.value }))} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"><option value="" disabled>Choose an update</option>{['unpaid', 'pending', 'paid', 'failed', 'refunded'].map((item) => <option key={item} value={item}>{title(item)}</option>)}</select></label>
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Method / provider<input value={payment.provider} onChange={(event) => setPayment((current) => ({ ...current, provider: event.target.value }))} maxLength={40} placeholder="Cash on delivery, Easypaisa…" className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Transaction reference<input value={payment.reference} onChange={(event) => setPayment((current) => ({ ...current, reference: event.target.value }))} maxLength={160} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Staff note<input value={payment.note} onChange={(event) => setPayment((current) => ({ ...current, note: event.target.value }))} maxLength={500} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <button disabled={busy} className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-neutral-950 px-4 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-50 dark:bg-white dark:text-neutral-950 sm:col-span-2"><Check className="h-4 w-4"/>Save payment update</button>
          </form>}
        </Panel>

        <Panel title="Activity history" icon={Clock3}>
          {order.events.length ? <ol className="space-y-4">{order.events.map((event) => <li key={event.id} className="relative border-l border-neutral-200 pl-4 dark:border-white/10"><span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-teal-600 ring-4 ring-white dark:ring-[#141416]"/><p className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{title(event.type)}{event.fromValue && event.toValue ? ` · ${title(event.fromValue)} → ${title(event.toValue)}` : ''}</p>{event.note && <p className="mt-1 whitespace-pre-wrap text-xs text-neutral-500">{event.note}</p>}<p className="mt-1 text-[11px] text-neutral-400">{event.actorName || 'Administrator'} · {dateTime(event.createdAt)}</p></li>)}</ol> : <p className="text-sm text-neutral-500">No staff updates have been recorded yet.</p>}
        </Panel>
      </div>

      <aside className="space-y-5">
        <Panel title="Customer" icon={UserRound}><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1"><Field label="Name" value={order.customerName}/><Field label="Email" value={order.customerEmail}/><Field label="Account phone" value={order.customerPhone}/><Field label="Delivery recipient" value={order.recipient_name}/><Field label="Delivery phone" value={order.phone}/></div></Panel>
        <Panel title="Delivery address" icon={MapPin}><p className="whitespace-pre-wrap text-sm leading-6 text-neutral-700 dark:text-neutral-300">{customerAddress}</p>{order.customer_note && <div className="mt-4 rounded-2xl bg-neutral-50 p-3 dark:bg-white/[0.03]"><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Customer instructions</p><p className="mt-1 whitespace-pre-wrap text-sm text-neutral-700 dark:text-neutral-300">{order.customer_note}</p></div>}</Panel>
        <Panel title="Fulfillment" icon={Truck}>
          <form onSubmit={(event) => { event.preventDefault(); runAction(() => adminOrders.updateFulfillment(order.id, fulfillment), 'Fulfillment details saved.'); }} className="space-y-3">
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Courier / delivery service<input disabled={!canEditFulfillment} value={fulfillment.courier} onChange={(event) => setFulfillment((current) => ({ ...current, courier: event.target.value }))} maxLength={120} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Tracking / consignment number<input disabled={!canEditFulfillment} value={fulfillment.tracking} onChange={(event) => setFulfillment((current) => ({ ...current, tracking: event.target.value }))} maxLength={160} className="h-10 rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <label className="grid gap-1 text-xs font-medium text-neutral-500">Internal note<textarea disabled={!canEditFulfillment} value={fulfillment.internalNote} onChange={(event) => setFulfillment((current) => ({ ...current, internalNote: event.target.value }))} maxLength={1000} rows={3} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800 disabled:opacity-50 dark:border-white/10 dark:bg-[#101012] dark:text-neutral-200"/></label>
            <button disabled={busy || !canEditFulfillment} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-neutral-200 text-xs font-semibold text-neutral-700 transition hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"><RefreshCw className="h-3.5 w-3.5"/>Save delivery details</button>
          </form>
          {order.reservations.length > 0 && <div className="mt-4 border-t border-neutral-100 pt-4 dark:border-white/10"><p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Stock reservation</p><div className="mt-2 space-y-2">{order.reservations.map((item, index) => <div key={`${item.sku}-${index}`} className="flex justify-between text-xs text-neutral-600 dark:text-neutral-300"><span>{item.sku || 'Variant'} · {item.quantity}</span><Badge tone={item.status === 'reserved' ? 'warning' : item.status === 'fulfilled' ? 'success' : 'neutral'}>{title(item.status)}</Badge></div>)}</div></div>}
        </Panel>
        <Panel title="Order actions" icon={PackageCheck}>
          {nextStatuses.length ? <div className="space-y-3">{nextStatuses.map((status) => <div key={status} className="space-y-2"><button type="button" disabled={busy} onClick={() => runAction(() => adminOrders.updateStatus(order.id, { status, reason, overrideReason }), status === 'confirmed' ? 'Order confirmed and available stock reserved.' : status === 'shipped' ? 'Order marked shipped and reserved stock deducted.' : 'Order status updated.') } className={`inline-flex h-10 w-full items-center justify-center gap-2 rounded-full px-4 text-xs font-semibold disabled:opacity-50 ${['cancelled', 'refunded'].includes(status) ? 'border border-red-200 text-red-700 hover:bg-red-50 dark:border-red-500/20 dark:text-red-300 dark:hover:bg-red-500/10' : 'bg-neutral-950 text-white hover:bg-neutral-800 dark:bg-white dark:text-neutral-950'}`}><Check className="h-3.5 w-3.5"/>{statusActionLabel(status)}</button>
              {status === 'cancelled' && <input aria-label="Cancellation reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder="Cancellation reason (required)" className="h-9 w-full rounded-xl border border-neutral-200 bg-white px-3 text-xs dark:border-white/10 dark:bg-[#101012]"/>}
              {status === 'delivered' && order.payment_status !== 'paid' && <input aria-label="Unpaid delivery override reason" value={overrideReason} onChange={(event) => setOverrideReason(event.target.value)} maxLength={500} placeholder="Reason for delivery before payment" className="h-9 w-full rounded-xl border border-amber-300 bg-white px-3 text-xs dark:border-amber-500/30 dark:bg-[#101012]"/>}
            </div>)}</div> : <p className="text-sm text-neutral-500">This order is in a final status. No further status changes are available.</p>}
          <p className="mt-4 text-[11px] leading-relaxed text-neutral-400">Confirming checks and reserves available stock. Shipping deducts reserved quantities. Cancelling releases active reservations.</p>
        </Panel>
      </aside>
    </div>
  </div>;
}
