import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx';
import { publicOrders } from '../../lib/api.js';
import OrderSummary from './OrderSummary.jsx';

const emptyForm = { recipientName: '', email: '', phone: '', addressLine1: '', addressLine2: '', city: '', province: '', postalCode: '', note: '' };

export default function CheckoutPage() {
  const { items, clearCart } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState(emptyForm);
  const [quote, setQuote] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!items.length) { setQuote(null); setPreviewLoading(false); return () => { active = false; }; }
    setPreviewLoading(true); setError('');
    publicOrders.preview({ items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) })
      .then((result) => { if (active) setQuote(result); })
      .catch((failure) => { if (active) { setQuote(null); setError(failure.message || 'Prices and stock could not be checked.'); } })
      .finally(() => { if (active) setPreviewLoading(false); });
    return () => { active = false; };
  }, [items]);

  function setField(field, value) { setForm((current) => ({ ...current, [field]: value })); }

  async function submit(event) {
    event.preventDefault();
    if (!items.length || !quote) return;
    setSubmitting(true); setError(''); setMessage('');
    try {
      const order = await publicOrders.place({
        ...form,
        items: items.map(({ variantId, quantity }) => ({ variantId, quantity })),
        expectedItems: quote.items.map(({ variantId, unitPrice, productName, optionLabel, metalRate }) => ({ variantId, unitPrice, productName, optionLabel, metalRate })),
      });
      clearCart();
      navigate(`/order-confirmation/${encodeURIComponent(order.orderNumber)}`, { state: { order } });
    } catch (failure) {
      setError(failure.message || 'Your order could not be submitted.');
      if (failure.status === 409) setMessage('We rechecked the current price and stock. Review the updated summary before trying again.');
      try {
        const current = await publicOrders.preview({ items: items.map(({ variantId, quantity }) => ({ variantId, quantity })) });
        setQuote(current);
      } catch { setQuote(null); }
    } finally { setSubmitting(false); }
  }

  if (!items.length) return <main className="min-h-[60vh] bg-[#fbfaf8] px-5 py-16 text-stone-900"><div className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center"><h1 className="font-serif text-3xl">Your bag is empty</h1><p className="mt-3 text-sm text-stone-500">Add a piece before entering delivery details.</p><Link to="/shop" className="mt-6 inline-flex rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-wider text-white">Browse jewelry</Link></div></main>;

  return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 pb-16 pt-8 text-stone-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900"><ArrowLeft className="h-3.5 w-3.5"/>Back to bag</Link><header className="mt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-800">Secure order request</p><h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Delivery details</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">Your order is reserved when submitted. We’ll contact you to confirm the delivery fee and payment options before fulfilment. No payment is collected now.</p></header>
    {message && <p role="status" className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>}{error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl">Who should receive it?</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Recipient name<input required maxLength={160} autoComplete="name" value={form.recipientName} onChange={(event) => setField('recipientName', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Phone number<input required maxLength={32} autoComplete="tel" type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+92…" className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Email (optional)<input maxLength={254} autoComplete="email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
      </div>
      <h2 className="mt-8 font-serif text-2xl">Where should we deliver?</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Address<input required maxLength={255} autoComplete="address-line1" value={form.addressLine1} onChange={(event) => setField('addressLine1', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Apartment, suite, landmark (optional)<input maxLength={255} autoComplete="address-line2" value={form.addressLine2} onChange={(event) => setField('addressLine2', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">City<input required maxLength={100} autoComplete="address-level2" value={form.city} onChange={(event) => setField('city', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Province / region<input required maxLength={100} autoComplete="address-level1" value={form.province} onChange={(event) => setField('province', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Postal code (optional)<input maxLength={20} autoComplete="postal-code" value={form.postalCode} onChange={(event) => setField('postalCode', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Delivery instructions (optional)<textarea rows={3} maxLength={2000} value={form.note} onChange={(event) => setField('note', event.target.value)} className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm outline-none focus:border-amber-700"/></label>
      </div>
      <div className="mt-6 flex items-start gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-600"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"/><span>We’ll use these details to contact you about this order. Payment credentials are not requested or stored.</span></div>
      </section>
      <div className="space-y-4 lg:sticky lg:top-28"><OrderSummary items={quote?.items || []} subtotal={quote?.subtotal || 0} loading={previewLoading}/><button type="submit" disabled={submitting || previewLoading || !quote} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Submitting order…</> : <>Place order<ArrowRight className="h-4 w-4"/></>}</button><p className="text-center text-[11px] leading-5 text-stone-400">Submitting creates an order and reserves available stock. The final delivery fee and payment method are confirmed with you afterward.</p></div>
    </form>
  </div></main>;
}
