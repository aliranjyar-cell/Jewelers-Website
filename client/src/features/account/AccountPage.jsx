import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router';
import { ArrowRight, LoaderCircle, LogOut, UserRound } from 'lucide-react';
import { customerAuth } from '../../lib/api.js';

export default function AccountPage() {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => { let active = true; customerAuth.current().then(({ customer: result }) => { if (active) setCustomer(result); }).catch((failure) => { if (active) setError(failure.message); }).finally(() => { if (active) setLoading(false); }); return () => { active = false; }; }, []);
  if (loading) return <main className="grid min-h-[60vh] place-items-center bg-[#fbfaf8] text-sm text-stone-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin"/>Loading account…</main>;
  if (!customer) return <Navigate to="/login" replace state={{ returnTo: '/account' }} />;
  async function signOut() { await customerAuth.logout(); setCustomer(null); }
  return <main className="min-h-[65vh] bg-[#fbfaf8] px-5 py-12 text-stone-900 sm:px-8"><div className="mx-auto max-w-4xl"><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-800">Your account</p><h1 className="mt-2 font-serif text-4xl font-light">Welcome, {customer.name}</h1>{error && <p role="alert" className="mt-4 text-sm text-red-700">{error}</p>}<div className="mt-8 grid gap-4 md:grid-cols-2"><section className="rounded-3xl border border-stone-200 bg-white p-6"><span className="grid h-11 w-11 place-items-center rounded-full bg-stone-100 text-stone-600"><UserRound className="h-5 w-5"/></span><h2 className="mt-4 font-serif text-2xl">Profile</h2><p className="mt-3 text-sm text-stone-600">{customer.email}</p><p className="mt-1 text-sm text-stone-600">{customer.phone}</p><button type="button" onClick={signOut} className="mt-6 inline-flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-950"><LogOut className="h-4 w-4"/>Sign out</button></section><Link to="/account/orders" className="group rounded-3xl border border-stone-200 bg-white p-6 transition hover:border-amber-700/40 hover:shadow-lg"><span className="grid h-11 w-11 place-items-center rounded-full bg-amber-50 text-amber-800"><ArrowRight className="h-5 w-5"/></span><h2 className="mt-4 font-serif text-2xl">Your orders</h2><p className="mt-2 text-sm leading-6 text-stone-500">Review your order status, payment preference, and order totals.</p><span className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-800">View order history <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/></span></Link></div></div></main>;
}
