import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { Archive, ArrowUpRight, Boxes, Gem, Plus, Search, Tag } from 'lucide-react';
import { adminProducts } from '../../lib/api.js';
import { formatNumber, formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const STATUS_TONE = { published: 'success', draft: 'warning', archived: 'neutral' };

export default function ProductsPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      adminProducts.list({ search, status, page, pageSize: 20 })
        .then((result) => { if (active) { setData(result); setError(''); } })
        .catch((failure) => { if (active) setError(failure.message); })
        .finally(() => { if (active) setLoading(false); });
    }, search ? 250 : 0);
    return () => { active = false; clearTimeout(timer); };
  }, [search, status, page]);

  const pages = Math.max(1, Math.ceil(data.total / data.pageSize));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 pt-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-teal-700 dark:text-teal-300">Catalogue</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white sm:text-4xl">Products</h1>
          <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">Manage jewelry, variants, stock, pricing and search previews.</p>
        </div>
        <Link to="/admin/products/new" className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-neutral-950 px-5 text-sm font-medium text-white shadow-sm transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200">
          <Plus className="h-4 w-4" /> Add product
        </Link>
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-neutral-100 p-4 dark:border-white/10 sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <label className="relative block w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search name or SKU" className="h-10 w-full rounded-full border border-neutral-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#141416]" />
          </label>
          <div className="flex flex-wrap gap-1 rounded-full bg-neutral-100 p-1 dark:bg-white/5" aria-label="Filter by status">
            {[['', 'All'], ['published', 'Published'], ['draft', 'Draft'], ['archived', 'Archived']].map(([value, label]) => (
              <button key={value || 'all'} type="button" onClick={() => { setStatus(value); setPage(1); }} aria-pressed={status === value} className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${status === value ? 'bg-neutral-950 text-white shadow-sm dark:bg-white dark:text-neutral-950' : 'text-neutral-500 hover:text-neutral-950 dark:text-neutral-400 dark:hover:text-white'}`}>{label}</button>
            ))}
          </div>
        </div>

        {error && <div role="alert" className="m-5 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-300">{error}</div>}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="bg-neutral-50/80 text-[11px] font-semibold uppercase tracking-[0.08em] text-neutral-400 dark:bg-white/[0.025] dark:text-neutral-500">
              <tr><th className="px-5 py-3">Product</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Price</th><th className="px-4 py-3">Variants / stock</th><th className="px-5 py-3 text-right">Updated</th></tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 dark:divide-white/5">
              {loading ? Array.from({ length: 5 }, (_, index) => <tr key={index}><td className="px-5 py-4" colSpan={5}><Skeleton className="h-12 w-full" /></td></tr>) : data.items.map((product) => (
                <tr key={product.id} className="group transition hover:bg-neutral-50/70 dark:hover:bg-white/[0.025]">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {product.image ? <img src={product.image} alt="" className="h-12 w-12 rounded-2xl bg-neutral-100 object-cover dark:bg-white/10" /> : <span className="grid h-12 w-12 place-items-center rounded-2xl bg-neutral-100 text-neutral-400 dark:bg-white/10"><Gem className="h-5 w-5" /></span>}
                      <div className="min-w-0"><Link to={`/admin/products/${product.id}/edit`} className="block max-w-xs truncate font-semibold text-neutral-950 hover:text-teal-700 dark:text-white dark:hover:text-teal-300">{product.name}</Link><p className="mt-0.5 truncate text-xs text-neutral-500 dark:text-neutral-400">{product.category || 'No category'} · {product.metalType}{product.purity ? ` · ${product.purity}` : ''}</p>{product.isFeatured && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 dark:text-amber-300"><Tag className="h-3 w-3" /> Featured</span>}</div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5"><Badge tone={STATUS_TONE[product.status] || 'neutral'}>{product.status}</Badge></td>
                  <td className="px-4 py-3.5 font-medium tabular-nums text-neutral-800 dark:text-neutral-200">{product.fixedPrice === null ? <span className="text-neutral-400">Rate based</span> : formatPKR(product.fixedPrice)}</td>
                  <td className="px-4 py-3.5"><span className="inline-flex items-center gap-1.5 text-neutral-600 dark:text-neutral-300"><Boxes className="h-4 w-4 text-neutral-400" />{formatNumber(product.variantCount)} variants · {formatNumber(product.stock)} units</span></td>
                  <td className="px-5 py-3.5 text-right"><Link aria-label={`Edit ${product.name}`} to={`/admin/products/${product.id}/edit`} className="inline-flex h-9 items-center gap-1 rounded-full px-3 text-xs font-medium text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 dark:hover:bg-white/10 dark:hover:text-white">Edit <ArrowUpRight className="h-3.5 w-3.5" /></Link></td>
                </tr>
              ))}
              {!loading && !data.items.length && <tr><td colSpan={5} className="px-6 py-16 text-center"><Archive className="mx-auto h-8 w-8 text-neutral-300 dark:text-neutral-600" /><p className="mt-3 font-semibold text-neutral-800 dark:text-neutral-200">No products found</p><p className="mt-1 text-sm text-neutral-500">Try another search or add your first product.</p><Link to="/admin/products/new" className="mt-4 inline-flex rounded-full bg-neutral-950 px-4 py-2 text-xs font-medium text-white dark:bg-white dark:text-neutral-950">Add a product</Link></td></tr>}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-neutral-100 px-5 py-3 text-xs text-neutral-500 dark:border-white/10 dark:text-neutral-400">
          <span>{loading ? 'Loading products…' : `${formatNumber(data.total)} products`}</span>
          <div className="flex items-center gap-2"><button type="button" disabled={page <= 1 || loading} onClick={() => setPage((value) => value - 1)} className="rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10">Previous</button><span>Page {page} of {pages}</span><button type="button" disabled={page >= pages || loading} onClick={() => setPage((value) => value + 1)} className="rounded-full border border-neutral-200 px-3 py-1.5 disabled:opacity-40 dark:border-white/10">Next</button></div>
        </div>
      </Card>
    </div>
  );
}
