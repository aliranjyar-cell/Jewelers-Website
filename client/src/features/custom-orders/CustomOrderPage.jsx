import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, CheckCircle2, LoaderCircle, ShieldCheck, X } from 'lucide-react';
import { customerAuth, publicCustomOrders } from '../../lib/api.js';

const emptyRequest = { requestType: 'ring', description: '', requestedMetal: '', requestedPurity: '', estimatedWeight: '', referenceImageUrl: '' };
const emptyAccount = { fullName: '', email: '', phone: '', password: '', confirmPassword: '' };

export default function CustomOrderPage() {
  const [customer, setCustomer] = useState(null);
  const [accountLoading, setAccountLoading] = useState(true);
  const [request, setRequest] = useState(emptyRequest);
  const [account, setAccount] = useState(emptyAccount);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(null);

  useEffect(() => {
    let active = true;
    customerAuth.current().then((result) => { if (active) setCustomer(result.customer); }).catch(() => {}).finally(() => { if (active) setAccountLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!accountModalOpen) return undefined;
    const closeOnEscape = (event) => { if (event.key === 'Escape' && !submitting) setAccountModalOpen(false); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [accountModalOpen, submitting]);

  function setRequestField(field, value) { setRequest((current) => ({ ...current, [field]: value })); }
  function setAccountField(field, value) { setAccount((current) => ({ ...current, [field]: value })); }

  async function sendRequest() {
    setSubmitting(true); setError('');
    try {
      const result = await publicCustomOrders.create(request);
      setSubmitted(result);
      setAccountModalOpen(false);
    } catch (failure) { setError(failure.message || 'Your request could not be submitted.'); }
    finally { setSubmitting(false); }
  }

  async function submitRequest(event) {
    event.preventDefault(); setError('');
    if (accountLoading) return;
    if (!customer) { setAccountModalOpen(true); return; }
    await sendRequest();
  }

  async function createAccountAndSend(event) {
    event.preventDefault(); setError('');
    if (account.password !== account.confirmPassword) { setError('The passwords do not match.'); return; }
    setSubmitting(true);
    try {
      const result = await customerAuth.register({ fullName: account.fullName, email: account.email, phone: account.phone, password: account.password });
      setCustomer(result.customer);
      setAccountModalOpen(false);
      await sendRequest();
    } catch (failure) { setError(failure.message || 'Your account could not be created.'); }
    finally { setSubmitting(false); }
  }

  if (submitted) return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 py-16 text-stone-900"><section className="mx-auto max-w-2xl rounded-[2rem] border border-stone-200 bg-white p-8 text-center sm:p-12"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-7 w-7"/></span><p className="mt-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Request received</p><h1 className="mt-2 font-serif text-4xl font-light">Thank you for sharing your idea.</h1><p className="mt-4 text-sm leading-6 text-stone-600">Your request number is <strong>{submitted.requestNumber}</strong>. The store will review the design details and follow up with questions or a quote. This request is not a confirmed order, and no final price has been set.</p><Link to="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-stone-900 px-6 py-3 text-sm text-white hover:bg-stone-700">Return to the collection <ArrowRight className="h-4 w-4"/></Link></section></main>;

  return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 pb-16 pt-8 text-stone-900 sm:px-8"><div className="mx-auto max-w-5xl"><Link to="/" className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900"><ArrowLeft className="h-4 w-4"/>Home</Link><header className="mt-6 max-w-3xl"><p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-800">Custom design request</p><h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Tell us about the piece you have in mind.</h1><p className="mt-4 text-sm leading-7 text-stone-600">Share the design, preferred metal, and any sizing or weight details you know. The seller will review your request and respond with next steps or a quote. Sending a request does not place an order or confirm a price.</p></header>
    {customer && <div className="mt-6 flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm text-stone-600"><ShieldCheck className="h-4 w-4 text-emerald-700"/>Request will be saved to <strong className="text-stone-900">{customer.email}</strong>.</div>}
    {error && !accountModalOpen && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
    <form onSubmit={submitRequest} className="mt-7 grid items-start gap-7 lg:grid-cols-[minmax(0,1fr)_300px]"><section className="rounded-[2rem] border border-stone-200 bg-white p-5 sm:p-8"><div className="grid gap-5 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-medium text-stone-600">Type of piece<select value={request.requestType} onChange={(event) => setRequestField('requestType', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"><option value="ring">Ring</option><option value="necklace">Necklace</option><option value="chain">Chain</option><option value="other">Other jewelry</option></select></label><label className="grid gap-1.5 text-xs font-medium text-stone-600">Preferred metal<select value={request.requestedMetal} onChange={(event) => setRequestField('requestedMetal', event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"><option value="">Not sure yet</option><option value="gold">Gold</option><option value="silver">Silver</option><option value="other">Other</option></select></label><label className="grid gap-1.5 text-xs font-medium text-stone-600">Purity, if known<input value={request.requestedPurity} onChange={(event) => setRequestField('requestedPurity', event.target.value)} maxLength={40} placeholder="For example, 22K or 925" className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label><label className="grid gap-1.5 text-xs font-medium text-stone-600">Approximate weight in grams (optional)<input type="number" min="0.001" max="10000" step="0.001" value={request.estimatedWeight} onChange={(event) => setRequestField('estimatedWeight', event.target.value)} placeholder="If you know it" className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label><label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Describe your design<textarea required minLength={20} maxLength={5000} rows={6} value={request.description} onChange={(event) => setRequestField('description', event.target.value)} placeholder="Describe the style, occasion, size, stones, finish, budget range, or any details that will help the jeweller understand your idea." className="rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm leading-6 outline-none focus:border-amber-700"/><span className="-mt-3 text-[11px] font-normal text-stone-400">At least 20 characters. Please don’t include payment or sensitive account information.</span></label><label className="grid gap-1.5 text-xs font-medium text-stone-600 sm:col-span-2">Reference image link (optional)<input type="url" value={request.referenceImageUrl} onChange={(event) => setRequestField('referenceImageUrl', event.target.value)} placeholder="https://…" className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/><span className="text-[11px] font-normal text-stone-400">Use a link you’re comfortable sharing. Image upload can be added later.</span></label></div></section>
      <aside className="rounded-[2rem] border border-[#e1d8c8] bg-[#f4efe5] p-6 lg:sticky lg:top-28"><h2 className="font-serif text-2xl">What happens next?</h2><ol className="mt-4 space-y-4 text-sm leading-6 text-stone-600"><li><strong className="text-stone-900">1. Request received</strong><br/>We save it to your customer account.</li><li><strong className="text-stone-900">2. Seller reviews</strong><br/>The seller may ask for more details.</li><li><strong className="text-stone-900">3. Quote and approval</strong><br/>You review the quote before deciding whether to order.</li></ol><button type="submit" disabled={submitting || accountLoading} className="mt-7 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700 disabled:cursor-not-allowed disabled:opacity-50">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Sending…</> : <>Send custom request<ArrowRight className="h-4 w-4"/></>}</button><p className="mt-3 text-center text-[11px] leading-5 text-stone-500">{customer ? 'Saved to your customer account.' : 'Sign in or create an account when you send it.'}</p></aside>
    </form></div>
    {accountModalOpen && <div className="fixed inset-0 z-[100] grid place-items-center bg-stone-950/55 p-4 backdrop-blur-sm" onMouseDown={(event) => { if (event.target === event.currentTarget && !submitting) setAccountModalOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="custom-account-title" className="max-h-[min(90vh,720px)] w-full max-w-lg overflow-y-auto rounded-[1.75rem] border border-stone-200 bg-[#fbfaf8] p-6 shadow-2xl sm:p-8"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Save your request</p><h2 id="custom-account-title" className="mt-2 font-serif text-3xl font-light">Create your account</h2><p className="mt-2 text-sm leading-6 text-stone-500">Requests are attached to your account so you can follow up with the store.</p></div><button type="button" disabled={submitting} onClick={() => setAccountModalOpen(false)} aria-label="Close account form" className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-stone-500 hover:bg-stone-200 disabled:opacity-50"><X className="h-5 w-5"/></button></div>{error && <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<form onSubmit={createAccountAndSend} className="mt-5 grid gap-4 sm:grid-cols-2"><AccountField label="Full name" type="text" value={account.fullName} onChange={(value) => setAccountField('fullName', value)} required/><AccountField label="Email" type="email" value={account.email} onChange={(value) => setAccountField('email', value)} required/><AccountField label="Mobile number" type="tel" value={account.phone} onChange={(value) => setAccountField('phone', value)} required/><span className="hidden sm:block"/><AccountField label="Password (12+ characters)" type="password" value={account.password} onChange={(value) => setAccountField('password', value)} required minLength={12}/><AccountField label="Confirm password" type="password" value={account.confirmPassword} onChange={(value) => setAccountField('confirmPassword', value)} required minLength={12}/><button type="submit" disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Creating account…</> : 'Create account and send request'}</button></form><p className="mt-4 text-center text-sm text-stone-500">Already registered? <Link to="/login" state={{ returnTo: '/custom-order' }} className="font-medium text-amber-800 underline underline-offset-4">Sign in</Link></p></section></div>}
  </main>;
}

function AccountField({ label, type, value, onChange, required, minLength }) {
  return <label className="grid gap-1.5 text-xs font-medium text-stone-600">{label}<input type={type} value={value} onChange={(event) => onChange(event.target.value)} autoComplete={type === 'password' ? 'new-password' : undefined} required={required} minLength={minLength} maxLength={type === 'password' ? 1024 : 254} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label>;
}
