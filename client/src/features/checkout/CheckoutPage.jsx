import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { useCart } from '../cart/CartContext.jsx';
import { customerAuth, publicOrders } from '../../lib/api.js';
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
  const [customer, setCustomer] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [accountSubmitting, setAccountSubmitting] = useState(false);
  const [accountForm, setAccountForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [paymentMethod] = useState('easypaisa');

  useEffect(() => {
    let active = true;
    customerAuth.current()
      .then((result) => {
        if (!active) return;
        setCustomer(result.customer);
        setForm((current) => ({ ...current, recipientName: current.recipientName || result.customer.name, email: current.email || result.customer.email, phone: current.phone || result.customer.phone }));
      })
      .catch(() => {})
      .finally(() => { if (active) setAccountLoading(false); });
    return () => { active = false; };
  }, []);

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
  function setAccountField(field, value) { setAccountForm((current) => ({ ...current, [field]: value })); }

  async function submit(event) {
    event.preventDefault();
    if (!items.length || !quote) return;
    setError(''); setMessage('');
    if (!customer) {
      setAccountForm((current) => ({ ...current, fullName: current.fullName || form.recipientName, email: current.email || form.email, phone: current.phone || form.phone }));
      setAccountModalOpen(true);
      return;
    }
    await submitOrder();
  }

  async function submitOrder(orderForm = form) {
    setSubmitting(true); setError(''); setMessage('');
    try {
      const order = await publicOrders.place({
        ...orderForm,
        paymentMethod,
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

  async function createAccount(event) {
    event.preventDefault();
    setError('');
    if (accountForm.password !== accountForm.confirmPassword) { setError('The passwords do not match.'); return; }
    setAccountSubmitting(true);
    try {
      const result = await customerAuth.register({ fullName: accountForm.fullName, email: accountForm.email, phone: accountForm.phone, password: accountForm.password });
      setCustomer(result.customer);
      setForm((current) => ({ ...current, recipientName: current.recipientName || result.customer.name, email: result.customer.email, phone: current.phone || result.customer.phone }));
      setAccountModalOpen(false);
      await submitOrder({ ...form, recipientName: form.recipientName || result.customer.name, email: result.customer.email, phone: form.phone || result.customer.phone });
    } catch (failure) {
      setError(failure.message || 'Your account could not be created.');
    } finally { setAccountSubmitting(false); }
  }

  useEffect(() => {
    if (!accountModalOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !accountSubmitting) setAccountModalOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [accountModalOpen, accountSubmitting]);

  if (!items.length) return <main className="min-h-[60vh] bg-[#fbfaf8] px-5 py-16 text-stone-900"><div className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center"><h1 className="font-serif text-3xl">Your bag is empty</h1><p className="mt-3 text-sm text-stone-500">Add a piece before entering delivery details.</p><Link to="/shop" className="mt-6 inline-flex rounded-full bg-stone-900 px-6 py-3 text-xs font-medium uppercase tracking-wider text-white">Browse jewelry</Link></div></main>;

  return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 pb-16 pt-8 text-stone-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <Link to="/cart" className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] text-stone-500 hover:text-stone-900"><ArrowLeft className="h-3.5 w-3.5"/>Back to bag</Link><header className="mt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-800">Secure order request</p><h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Delivery details</h1><p className="mt-3 max-w-2xl text-sm leading-6 text-stone-500">Your order is reserved when submitted. We’ll contact you to confirm the delivery fee and payment options before fulfilment. No payment is collected now.</p></header>
    {message && <p role="status" className="mt-5 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">{message}</p>}{error && <p role="alert" className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submit} className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_360px]">
      {customer && <div className="rounded-2xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600">Ordering as <strong className="text-stone-900">{customer.email}</strong>. <button type="button" onClick={async () => { await customerAuth.logout(); setCustomer(null); }} className="ml-2 text-xs text-amber-800 underline underline-offset-4">Sign out</button></div>}
      <section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-7"><h2 className="font-serif text-2xl">Who should receive it?</h2><div className="mt-5 grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Recipient name<input required maxLength={160} autoComplete="name" value={form.recipientName} onChange={(event) => setField('recipientName', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Phone number<input required maxLength={32} autoComplete="tel" type="tel" value={form.phone} onChange={(event) => setField('phone', event.target.value)} placeholder="+92…" className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
        <label className="grid gap-1.5 text-xs font-medium text-stone-600">Email<input required maxLength={254} autoComplete="email" type="email" value={form.email} onChange={(event) => setField('email', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>
      </div>
      <h2 className="mt-8 font-serif text-2xl">Payment preference</h2><label className="mt-4 flex cursor-pointer items-start gap-3 rounded-2xl border border-amber-700/40 bg-amber-50/60 p-4"><input type="radio" name="paymentMethod" value="easypaisa" checked={paymentMethod === 'easypaisa'} readOnly className="mt-1 accent-amber-800"/><span><strong className="block text-sm text-stone-900">Easypaisa</strong><span className="mt-1 block text-xs leading-5 text-stone-600">Choose Easypaisa for digital payment. We’ll confirm the delivery fee and send payment instructions after reviewing your order. No payment is taken on this page.</span></span></label>
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
      <div className="space-y-4 lg:sticky lg:top-28"><OrderSummary items={quote?.items || []} subtotal={quote?.subtotal || 0} loading={previewLoading}/><button type="submit" disabled={submitting || accountLoading || previewLoading || !quote} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Submitting order…</> : <>Place order<ArrowRight className="h-4 w-4"/></>}</button><p className="text-center text-[11px] leading-5 text-stone-400">Your order is linked to your customer account. Easypaisa payment instructions follow after the seller confirms the delivery fee and order.</p></div>
    </form>
    {accountModalOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-stone-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !accountSubmitting) setAccountModalOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="checkout-account-title" className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-stone-200 bg-[#fbfaf8] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">One quick step</p><h2 id="checkout-account-title" className="mt-2 font-serif text-3xl font-light">Create your account</h2><p className="mt-2 text-sm leading-6 text-stone-500">An account is required to place an order. Your bag and delivery details will be kept while you finish.</p></div><button type="button" disabled={accountSubmitting} onClick={() => setAccountModalOpen(false)} aria-label="Close account form" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-stone-500 transition hover:bg-stone-200 hover:text-stone-900 disabled:opacity-50"><X className="h-5 w-5"/></button></div>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<form onSubmit={createAccount} className="mt-6 grid gap-4 sm:grid-cols-2"><ModalField label="Full name" type="text" autoComplete="name" value={accountForm.fullName} onChange={(value) => setAccountField('fullName', value)} required/><ModalField label="Email" type="email" autoComplete="email" value={accountForm.email} onChange={(value) => setAccountField('email', value)} required/><ModalField label="Mobile number" type="tel" autoComplete="tel" value={accountForm.phone} onChange={(value) => setAccountField('phone', value)} required/><span className="hidden sm:block"/><ModalField label="Create password (12+ characters)" type="password" autoComplete="new-password" value={accountForm.password} onChange={(value) => setAccountField('password', value)} required minLength={12}/><ModalField label="Confirm password" type="password" autoComplete="new-password" value={accountForm.confirmPassword} onChange={(value) => setAccountField('confirmPassword', value)} required minLength={12}/><button type="submit" disabled={accountSubmitting || submitting} className="mt-1 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-6 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2">{accountSubmitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Creating account…</> : 'Create account and place order'}</button></form><p className="mt-5 text-center text-sm text-stone-500">Already have an account? <Link to="/login" state={{ returnTo: '/checkout' }} className="font-medium text-amber-800 underline underline-offset-4">Sign in</Link></p><p className="mt-4 text-center text-[11px] text-stone-400">You can browse without an account. An account is only needed to place an order.</p></section></div>}
  </div></main>;
}

function ModalField({ label, type, autoComplete, value, onChange, required, minLength }) {
  return <label className="grid gap-1.5 text-xs font-medium text-stone-600">{label}<input type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} required={required} minLength={minLength} maxLength={type === 'password' ? 1024 : 254} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10"/></label>;
}
