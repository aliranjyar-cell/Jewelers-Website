import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, LoaderCircle, ShieldCheck } from 'lucide-react';
import { customerAuth } from '../../lib/api.js';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/account';
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const setField = (field, value) => setForm((current) => ({ ...current, [field]: value }));

  async function submit(event) {
    event.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) { setError('The passwords do not match.'); return; }
    setSubmitting(true);
    try {
      await customerAuth.register(form);
      navigate(returnTo, { replace: true });
    } catch (failure) { setError(failure.message || 'Your account could not be created.'); }
    finally { setSubmitting(false); }
  }

  return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 py-12 text-stone-900 sm:py-16"><div className="mx-auto max-w-xl"><Link to="/shop" className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900"><ArrowLeft className="h-4 w-4"/>Continue browsing</Link><section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(46,35,18,0.05)] sm:p-9"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Customer account</p><h1 className="mt-2 font-serif text-4xl font-light">Create your account</h1><p className="mt-3 text-sm leading-6 text-stone-500">An account is required to place an order. You can browse the collection without signing in.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<form onSubmit={submit} className="mt-6 grid gap-4 sm:grid-cols-2"><Field label="Full name" autoComplete="name" value={form.fullName} onChange={(value) => setField('fullName', value)} required className="sm:col-span-2"/><Field label="Email" type="email" autoComplete="email" value={form.email} onChange={(value) => setField('email', value)} required/><Field label="Mobile number" type="tel" autoComplete="tel" value={form.phone} onChange={(value) => setField('phone', value)} required/><Field label="Password (12+ characters)" type="password" autoComplete="new-password" value={form.password} onChange={(value) => setField('password', value)} required minLength={12}/><Field label="Confirm password" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={(value) => setField('confirmPassword', value)} required minLength={12}/><p className="flex gap-2 rounded-xl bg-stone-50 p-3 text-xs leading-5 text-stone-600 sm:col-span-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700"/>Your password is securely hashed by the server. We never ask for Easypaisa PINs or passwords.</p><button disabled={submitting} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-6 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50 sm:col-span-2">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Creating account…</> : 'Create account'}</button></form><p className="mt-5 text-center text-sm text-stone-500">Already registered? <Link to="/login" state={{ returnTo }} className="font-medium text-amber-800 underline underline-offset-4">Sign in</Link></p></section></div></main>;
}

function Field({ label, type = 'text', autoComplete, value, onChange, required, minLength, className = '' }) {
  return <label className={`grid gap-1.5 text-xs font-medium text-stone-600 ${className}`}>{label}<input type={type} autoComplete={autoComplete} value={value} onChange={(event) => onChange(event.target.value)} required={required} minLength={minLength} maxLength={type === 'password' ? 1024 : 254} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm text-stone-900 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-700/10"/></label>;
}
