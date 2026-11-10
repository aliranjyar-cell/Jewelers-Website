import { useEffect, useState } from 'react';
import { Check, Store } from 'lucide-react';
import { useStoreBrand } from '../../contexts/StoreBrandContext.jsx';
import { Card, CardHeader } from './dashboard/components/ui.jsx';
import AdminChangePasswordPage from './dashboardSettings/AdminChangePasswordPage.jsx';

export default function StoreSettingsPage() {
  const { storeName, saveStoreName } = useStoreBrand();
  const [value, setValue] = useState(storeName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => { setValue(storeName); }, [storeName]);

  async function submit(event) {
    event.preventDefault(); setSaving(true); setError(''); setSaved(false);
    try { await saveStoreName(value); setSaved(true); }
    catch (failure) { setError(failure.message || 'Website name could not be saved.'); }
    finally { setSaving(false); }
  }

  return <div className="space-y-6 pb-8">
    <header className="pt-2"><p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Configuration</p><h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Website settings</h1><p className="mt-1.5 max-w-2xl text-sm leading-6 text-neutral-500 dark:text-neutral-400">Set the name shown throughout your storefront and administration panel.</p></header>
    {error && <p role="alert" className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</p>}
    {saved && <p role="status" className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300"><Check className="h-4 w-4"/>Website name saved and applied across the site.</p>}
    <div className="grid max-w-4xl gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.8fr)]">
      <Card className="p-5 sm:p-6"><CardHeader title="Website name" subtitle="Use your public store or business name. This does not change your domain name."/>
        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="grid gap-1.5 text-xs font-medium text-neutral-500">Store name<input required minLength={2} maxLength={60} value={value} onChange={(event)=>setValue(event.target.value)} placeholder="For example, Zareen Jewellers" className="h-12 rounded-xl border border-neutral-200 bg-white px-4 text-base text-neutral-900 outline-none focus:border-teal-600 dark:border-white/10 dark:bg-[#101012] dark:text-white"/><span className="font-normal">2–60 characters. The change will update the header, footer, page labels, browser title, and admin brand areas.</span></label>
          <button type="submit" disabled={saving || value.trim() === storeName} className="h-11 rounded-full bg-neutral-950 px-6 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-neutral-950">{saving ? 'Saving…' : 'Save website name'}</button>
        </form>
      </Card>
      <Card className="flex min-h-52 flex-col justify-between p-6"><CardHeader title="Live preview" subtitle="The shared brand name updates as soon as you save."/><div className="mt-6 flex items-center gap-3 rounded-2xl bg-neutral-950 px-5 py-6 text-white"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-amber-300 font-serif text-xl text-amber-300"><Store className="h-5 w-5"/></span><span className="min-w-0 truncate font-serif text-lg tracking-[0.12em]">{value.trim() || 'Your website name'}</span></div></Card>
    </div>
    <AdminChangePasswordPage />
  </div>;
}
