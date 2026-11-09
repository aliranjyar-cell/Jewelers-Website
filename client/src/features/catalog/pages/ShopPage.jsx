import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ArrowLeft, ArrowRight, LoaderCircle, Search } from 'lucide-react';
import { publicProducts } from '../../../lib/api.js';
import ProductCard from './components/ProductCard.jsx';
import { useStoreBrand } from '../../../contexts/StoreBrandContext.jsx';

const PAGE_SIZE = 20;

export default function ShopPage() {
  const { storeName } = useStoreBrand();
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';

  const loadProducts = useCallback(() => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError('');
    publicProducts.list({ page, pageSize: PAGE_SIZE, search, category })
      .then((result) => {
        if (currentRequest !== requestId.current) return;
        setProducts(Array.isArray(result?.items) ? result.items : []);
        setTotal(Number(result?.total) || 0);
      })
      .catch((failure) => {
        if (currentRequest !== requestId.current) return;
        setProducts([]);
        setTotal(0);
        setError(failure.message || 'We could not load the collection. Please try again.');
      })
      .finally(() => { if (currentRequest === requestId.current) setLoading(false); });
  }, [page, search, category]);

  useEffect(() => { loadProducts(); }, [loadProducts]);
  useEffect(() => () => { requestId.current += 1; }, []);
  useEffect(() => {
    let active = true;
    publicProducts.categories()
      .then((result) => { if (active) setCategories(Array.isArray(result?.items) ? result.items : []); })
      .catch(() => { if (active) setCategories([]); });
    return () => { active = false; };
  }, []);

  function updateParams(updates) {
    setSearchParams((previous) => {
      const next = new URLSearchParams(previous);
      Object.entries(updates).forEach(([key, value]) => value ? next.set(key, value) : next.delete(key));
      return next;
    });
  }

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <main className="min-h-[70vh] bg-[#fbfaf8] text-stone-900">
      <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <Link to="/" className="inline-flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.18em] text-stone-500 hover:text-stone-900"><ArrowLeft className="h-3.5 w-3.5" /> Home</Link>
        <div className="mt-5 flex flex-col gap-6 border-b border-stone-200 pb-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-800">{storeName}</p>
            <h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">{category ? categories.find((item) => item.slug === category)?.name || 'Collection' : 'The collection'}</h1>
            {search && <p className="mt-2 text-sm text-stone-500">Results for “{search}”</p>}
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <label className="sr-only" htmlFor="shop-category">Filter by category</label>
            <select id="shop-category" value={category} onChange={(event) => updateParams({ category: event.target.value, page: '' })} className="h-12 rounded-full border border-stone-300 bg-white px-5 text-sm outline-none focus:border-amber-700">
              <option value="">All categories</option>
              {categories.map((item) => <option key={item.id} value={item.slug}>{item.name}</option>)}
            </select>
            <form role="search" onSubmit={(event) => { event.preventDefault(); updateParams({ search: new FormData(event.currentTarget).get('search')?.toString().trim() || '', page: '' }); }} className="flex h-12 min-w-0 items-center rounded-full border border-stone-300 bg-white pl-4 pr-1 focus-within:border-amber-700 sm:w-72">
              <Search className="h-4 w-4 shrink-0 text-stone-400" />
              <input key={search} name="search" type="search" defaultValue={search} placeholder="Search jewellery" aria-label="Search jewellery" className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none" />
              <button className="rounded-full bg-stone-900 px-4 py-2 text-xs text-white hover:bg-stone-700">Search</button>
            </form>
          </div>
        </div>

        {loading ? <div className="grid min-h-72 place-items-center text-sm text-stone-500"><span><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading the collection…</span></div> : error ? (
          <div className="grid min-h-72 place-items-center text-center"><div><p role="alert" className="text-sm text-stone-600">{error}</p><button type="button" onClick={loadProducts} className="mt-4 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white hover:bg-stone-700">Try again</button></div></div>
        ) : (
          <>
            <div className="grid gap-x-5 gap-y-8 py-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product) => <ProductCard key={product.id} product={{ ...product, price: product.minPrice }} className="hover:bg-white" />)}
            </div>
            {products.length === 0 && <div className="grid min-h-72 place-items-center text-center"><div><p className="font-serif text-2xl">No pieces found</p><p className="mt-2 text-sm text-stone-500">Try another search or browse all of our jewellery.</p><button type="button" onClick={() => setSearchParams({})} className="mt-5 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-amber-800">Clear filters <ArrowRight className="h-3.5 w-3.5" /></button></div></div>}
            {total > 0 && <div className="flex flex-col gap-4 border-t border-stone-200 pt-6 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-stone-500">Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, total)} of {total} pieces</p><div className="flex items-center gap-3"><button type="button" disabled={page <= 1} onClick={() => updateParams({ page: String(page - 1) })} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">Previous</button><span className="text-xs text-stone-500">Page {page} of {Math.max(totalPages, 1)}</span><button type="button" disabled={page >= totalPages} onClick={() => updateParams({ page: String(page + 1) })} className="rounded-full border border-stone-300 px-4 py-2 text-sm disabled:opacity-40">Next</button></div></div>}
          </>
        )}
      </section>
    </main>
  );
}
