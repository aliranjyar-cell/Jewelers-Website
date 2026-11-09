import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ArrowLeft, ArrowUpRight, LoaderCircle } from 'lucide-react';
import { customerAuth } from '../../lib/api.js';

const money = (value) => `PKR ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(value || 0))}`;
const label = (value = '') => value.replaceAll('_', ' ');

export default function OrdersPage() {
  const [customer, setCustomer] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [signedOut, setSignedOut] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    customerAuth.current().then(({ customer: account }) => {
      if (!active) return;
      setCustomer(account);
      return customerAuth.orders().then(({ items }) => { if (active) setOrders(items || []); });
    }).catch((failure) => { if (active) { setSignedOut(failure.status === 401); setError(failure.status === 401 ? '' : failure.message); } }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  if (loading) return <main className="grid min-h-[60vh] place-items-center bg-[#fbfaf8] text-sm text-stone-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin"/>Loading orders…</main>;
  if (signedOut || !customer) return <Navigate to="/login" replace state={{ returnTo: '/account/orders' }} />;
  return <main className="min-h-[65vh] bg-[#fbfaf8] px-5 py-12 text-stone-900 sm:px-8"><div className="mx-auto max-w-5xl"><Link to="/account" className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900"><ArrowLeft className="h-4 w-4"/>Account</Link><p className="mt-6 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Customer account</p><h1 className="mt-2 font-serif text-4xl font-light">Order history</h1>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}{!error && !orders.length && <section className="mt-7 rounded-3xl border border-stone-200 bg-white p-8 text-center"><h2 className="font-serif text-2xl">No orders yet</h2><p className="mt-2 text-sm text-stone-500">Your orders will appear here after checkout.</p><Link to="/shop" className="mt-5 inline-flex rounded-full bg-stone-900 px-5 py-3 text-xs font-medium uppercase tracking-wider text-white">Explore the collection</Link></section>}<div className="mt-7 space-y-3">{orders.map((order) => <article key={order.id} className="rounded-2xl border border-stone-200 bg-white p-5 sm:flex sm:items-center sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-wider text-stone-900">{order.orderNumber}</p><p className="mt-1 text-xs text-stone-500">{new Intl.DateTimeFormat('en-PK', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(order.createdAt))} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'}</p><div className="mt-3 flex flex-wrap gap-2"><span className="rounded-full bg-stone-100 px-3 py-1 text-[11px] capitalize text-stone-700">{label(order.status)}</span><span className="rounded-full bg-amber-50 px-3 py-1 text-[11px] capitalize text-amber-900">Payment: {label(order.paymentStatus)}</span>{order.paymentMethod && <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] capitalize text-emerald-900">{label(order.paymentMethod)}</span>}</div></div><div className="mt-4 flex items-center justify-between gap-5 sm:mt-0"><div className="text-right"><p className="text-[10px] uppercase tracking-wider text-stone-400">{order.deliveryFeeConfirmed ? 'Total' : 'Subtotal'}</p><p className="mt-1 text-lg font-medium">{money(order.deliveryFeeConfirmed ? order.total : order.subtotal)}</p></div><span aria-label="Order detail available after admin order page" className="grid h-10 w-10 place-items-center rounded-full bg-stone-50 text-stone-500"><ArrowUpRight className="h-4 w-4"/></span></div>{!order.deliveryFeeConfirmed && <p className="mt-3 text-xs leading-5 text-stone-500 sm:basis-full">The store will confirm delivery charges and the final total before collecting payment.</p>}</article>)}</div></div></main>;
}
