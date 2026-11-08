import { useEffect, useState } from 'react';
import { Navigate } from 'react-router';
import { adminAuth } from '../../lib/api.js';


export default function AdminHomePage() {
  const [state, setState] = useState({ loading: true, user: null, csrfToken: null, error: '' });
  const [logoutError, setLogoutError] = useState('');

  useEffect(() => {
    let active = true;
    adminAuth.current()
      .then((result) => { if (active) setState({ loading: false, user: result.user, csrfToken: result.csrfToken, error: '' }); })
      .catch(() => { if (active) setState({ loading: false, user: null, csrfToken: null, error: '' }); });
    return () => { active = false; };
  }, []);

  async function signOut() {
    setLogoutError('');
    try {
      await adminAuth.logout(state.csrfToken);
      window.location.assign('/admin/login');
    } catch {
      setLogoutError('Could not sign out. Please try again.');
    }
  }

  if (state.loading) return <main className="grid min-h-screen place-items-center text-stone-600">Checking administrator session…</main>;
  if (!state.user) return <Navigate to="/admin/login" replace />;

  return (

    <section className="mx-auto  max-w-3xl rounded-2xl border border-stone-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#141416]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-800">Jewelry House</p>
            <h1 className="mt-4 text-3xl font-semibold text-stone-900">Administrator access confirmed</h1>
            <p className="mt-2 text-stone-600">Signed in as {state.user.name}.</p>
          </div>
          <button onClick={signOut} className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 hover:bg-stone-50">Sign out</button>
        </div>
        {logoutError && <p role="alert" className="mt-4 text-sm text-red-800">{logoutError}</p>}
        <div className="mt-8 rounded-xl bg-stone-50 p-5">
          <h2 className="font-medium text-stone-900">Admin panel coming later</h2>
          <p className="mt-1 text-sm text-stone-600">This protected page is the sign-in destination. The admin tools will be added here in a later step.</p>
        </div>
      </section>

  );
}
