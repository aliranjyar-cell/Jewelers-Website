import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowLeft, LoaderCircle } from 'lucide-react';
import { customerAuth } from '../../lib/api.js';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function submit(event) {
    event.preventDefault(); setError(''); setSubmitting(true);
    try { await customerAuth.login({ email, password }); navigate(returnTo, { replace: true }); }
    catch (failure) { setError(failure.message || 'Sign in could not be completed.'); }
    finally { setSubmitting(false); }
  }

  return <main className="min-h-[70vh] bg-[#fbfaf8] px-5 py-12 text-stone-900 sm:py-16"><div className="mx-auto max-w-lg"><Link to="/shop" className="inline-flex items-center gap-2 text-xs text-stone-500 hover:text-stone-900"><ArrowLeft className="h-4 w-4"/>Continue browsing</Link><section className="mt-6 rounded-[2rem] border border-stone-200 bg-white p-6 shadow-[0_20px_60px_rgba(46,35,18,0.05)] sm:p-9"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Customer account</p><h1 className="mt-2 font-serif text-4xl font-light">Welcome back</h1><p className="mt-3 text-sm leading-6 text-stone-500">Sign in to continue checkout or view your orders.</p>{error && <p role="alert" className="mt-5 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}<form onSubmit={submit} className="mt-6 grid gap-4"><label className="grid gap-1.5 text-xs font-medium text-stone-600">Email<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label><label className="grid gap-1.5 text-xs font-medium text-stone-600">Password<input type="password" autoComplete="current-password" required maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border border-stone-300 bg-white px-4 text-sm outline-none focus:border-amber-700"/></label><button disabled={submitting} className="mt-2 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-6 text-sm font-medium text-white hover:bg-stone-700 disabled:opacity-50">{submitting ? <><LoaderCircle className="h-4 w-4 animate-spin"/>Signing in…</> : 'Sign in'}</button></form><p className="mt-5 text-center text-sm text-stone-500">New here? <Link to="/register" state={{ returnTo }} className="font-medium text-amber-800 underline underline-offset-4">Create an account</Link></p></section></div></main>;
}
