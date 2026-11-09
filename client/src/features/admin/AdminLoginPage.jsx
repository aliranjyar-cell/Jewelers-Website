import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { adminAuth } from '../../lib/api.js';
import { useStoreBrand } from '../../contexts/StoreBrandContext.jsx';

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { storeName } = useStoreBrand();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await adminAuth.login({ email, password, otp });
      navigate('/admin', { replace: true });
    } catch (failure) {
      setError(failure.message || 'Unable to sign in. Check your details or try again later.');
    } finally { setBusy(false); }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 px-5 py-12">
      <section className="w-full max-w-md rounded-2xl border border-stone-200 bg-white p-8 shadow-sm">
        <Link to="/" className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-800">{storeName}</Link>
        <h1 className="mt-6 text-3xl font-semibold text-stone-900">Admin sign in</h1>
        <p className="mt-2 text-sm text-stone-600">Use your administrator account and authenticator code.</p>
        <form className="mt-8 space-y-5" onSubmit={submit}>
          <label className="block text-sm font-medium text-stone-700">
            Email
            <input required autoComplete="username" type="email" maxLength={254} value={email} onChange={(event) => setEmail(event.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Password
            <input required autoComplete="current-password" type="password" maxLength={1024} value={password} onChange={(event) => setPassword(event.target.value)} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
          <label className="block text-sm font-medium text-stone-700">
            Authenticator code
            <input required inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" minLength={6} maxLength={6} value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))} className="mt-2 w-full rounded-lg border border-stone-300 px-3 py-2.5 tracking-[0.3em] outline-none focus:border-amber-700 focus:ring-2 focus:ring-amber-100" />
          </label>
          {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{error}</p>}
          <button disabled={busy} className="w-full rounded-lg bg-stone-900 px-4 py-3 font-medium text-white hover:bg-stone-700 disabled:cursor-wait disabled:opacity-60">
            {busy ? 'Signing in…' : 'Sign in securely'}
          </button>
        </form>
      </section>
    </main>
  );
}
