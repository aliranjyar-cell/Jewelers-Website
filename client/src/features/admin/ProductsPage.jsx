import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Archive, ArrowRight, ArrowUpRight, Boxes, Check, ChevronLeft, ChevronRight, ExternalLink, Gem, ImageOff, LoaderCircle, Plus, Search, Tag, X } from 'lucide-react';
import { adminProducts } from '../../lib/api.js';
import { formatNumber, formatPKR } from './dashboard/utils/format.js';
import { Badge, Card, Skeleton } from './dashboard/components/ui.jsx';

const STATUS_TONE = { published: 'success', draft: 'warning', archived: 'neutral' };

const API_BASE = (import.meta.env.VITE_API_URL ?? "").replace(/\/+$/, "");

function imageUrl(src) {
  if (!src) return "";
  return src.startsWith("/") ? `${API_BASE}${src}` : src;
}

export default function ProductsPage() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(() => ['published', 'draft', 'archived'].includes(searchParams.get('status')) ? searchParams.get('status') : '');
  const [page, setPage] = useState(1);
  const [data, setData] = useState({ items: [], total: 0, pageSize: 20 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [popupLoading, setPopupLoading] = useState(false);
  const [popupError, setPopupError] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const closeButtonRef = useRef(null);
  const triggerRef = useRef(null);

  const popupImages = selectedProduct?.images?.length
    ? selectedProduct.images
    : selectedProduct?.image
      ? [{ url: selectedProduct.image, altText: selectedProduct.name || 'Product' }]
      : [];
  const activeImage = popupImages[selectedImage] || popupImages[0];

  const detail = useMemo(() => {
    if (!selectedProduct) return null;
    const variants = selectedProduct.variants || [];
    const fixedPrices = variants.filter((v) => v.fixedPrice != null).map((v) => v.fixedPrice);
    const priceLabel = fixedPrices.length ? `${formatPKR(Math.min(...fixedPrices))} – ${formatPKR(Math.max(...fixedPrices))}` : "Rate based";
    const totalStock = variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0);
    return { variants, priceLabel, totalStock };
  }, [selectedProduct]);

  useEffect(() => {
    if (!selectedProduct) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const focusTimer = window.setTimeout(() => closeButtonRef.current?.focus(), 0);
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') closeDetail();
      if (popupImages.length > 1 && event.key === 'ArrowLeft') setSelectedImage((index) => (index - 1 + popupImages.length) % popupImages.length);
      if (popupImages.length > 1 && event.key === 'ArrowRight') setSelectedImage((index) => (index + 1) % popupImages.length);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [selectedProduct, popupImages.length]);

  useEffect(() => setImageFailed(false), [selectedProduct?.id, selectedImage]);

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

  async function openProductDetail(product, trigger) {
    triggerRef.current = trigger;
    setSelectedProduct(product);
    setSelectedImage(0);
    setPopupError('');
    setPopupLoading(true);
    try {
      const fullProduct = await adminProducts.get(product.id);
      setSelectedProduct(fullProduct);
    } catch (failure) {
      setPopupError(failure.message || "Could not load product details.");
    } finally {
      setPopupLoading(false);
    }
  }

  function closeDetail() {
    setSelectedProduct(null);
    setPopupError('');
    window.requestAnimationFrame(() => triggerRef.current?.focus?.());
  }

  function stepImage(direction) {
    if (popupImages.length < 2) return;
    setSelectedImage((index) => (index + direction + popupImages.length) % popupImages.length);
  }

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
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          openProductDetail(product, event.currentTarget);
                        }}
                        aria-label={`View photos and details for ${product.name}`}
                        className="group/photo relative grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-neutral-100 text-neutral-400 outline-none ring-offset-2 transition hover:ring-2 hover:ring-teal-600 focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-white/10 dark:ring-offset-[#0A0A0B]"
                      >
                        {product.image ? <img src={imageUrl(product.image)} alt="" className="h-full w-full object-cover transition duration-300 group-hover/photo:scale-105" /> : <Gem className="h-5 w-5" />}
                        <span className="absolute inset-0 grid place-items-center bg-black/35 text-white opacity-0 transition group-hover/photo:opacity-100 group-focus-visible/photo:opacity-100"><ExternalLink className="h-4 w-4" /></span>
                      </button>
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

      {selectedProduct && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="presentation">
          <button type="button" aria-label="Close product preview" onClick={closeDetail} className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md" />
          <section role="dialog" aria-modal="true" aria-labelledby="product-preview-title" className="relative z-10 flex max-h-[min(900px,calc(100dvh-1.5rem))] w-full max-w-6xl flex-col overflow-hidden rounded-[28px] border border-white/10 bg-white shadow-2xl shadow-black/40 dark:bg-[#111113] sm:max-h-[min(900px,calc(100dvh-3rem))]">
            <header className="flex shrink-0 items-center justify-between gap-3 border-b border-neutral-100 px-4 py-3 dark:border-white/10 sm:px-6">
              <div className="flex min-w-0 items-center gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-teal-700/10 text-teal-800 dark:bg-teal-300/15 dark:text-teal-300"><Gem className="h-4 w-4" /></span><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[0.15em] text-neutral-400">Product preview</p><h2 id="product-preview-title" className="truncate text-sm font-semibold text-neutral-950 dark:text-white">{selectedProduct.name || 'Product details'}</h2></div>{popupLoading && <LoaderCircle aria-label="Loading full product details" className="h-4 w-4 shrink-0 animate-spin text-teal-600" />}</div>
              <div className="flex shrink-0 items-center gap-2">{!popupLoading && <Link to={`/admin/products/${selectedProduct.id}/edit`} onClick={closeDetail} className="hidden h-9 items-center gap-1.5 rounded-full border border-neutral-200 px-3 text-xs font-medium text-neutral-700 transition hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5 sm:inline-flex">Edit product <ArrowUpRight className="h-3.5 w-3.5" /></Link>}<button ref={closeButtonRef} type="button" onClick={closeDetail} aria-label="Close product preview" className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 transition hover:bg-neutral-100 hover:text-neutral-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:text-neutral-300 dark:hover:bg-white/10 dark:hover:text-white"><X className="h-4 w-4" /></button></div>
            </header>

            <div className="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-[minmax(0,1.12fr)_minmax(320px,0.88fr)] md:overflow-hidden">
              <section aria-label="Product image gallery" className="flex min-h-[300px] flex-col bg-neutral-100 dark:bg-[#09090A] md:min-h-0">
                <div className="relative flex min-h-[300px] flex-1 items-center justify-center overflow-hidden bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-neutral-200 via-neutral-100 to-neutral-200 p-5 dark:from-neutral-800 dark:via-[#0A0A0B] dark:to-[#111113] sm:min-h-[380px] md:min-h-0 md:p-8">
                  {activeImage && !imageFailed ? <img src={imageUrl(activeImage.url)} alt={activeImage.altText || selectedProduct.name || 'Product photo'} className="max-h-full max-w-full rounded-xl object-contain drop-shadow-xl" onError={() => setImageFailed(true)} /> : <div className="flex flex-col items-center gap-3 text-neutral-400"><ImageOff className="h-10 w-10" /><span className="text-xs">{activeImage ? 'This image could not be loaded' : 'No product photo added'}</span></div>}
                  {popupImages.length > 1 && <><button type="button" onClick={() => stepImage(-1)} aria-label="Previous product photo" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-lg transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-neutral-900/90 dark:text-white dark:hover:bg-neutral-800"><ChevronLeft className="h-5 w-5" /></button><button type="button" onClick={() => stepImage(1)} aria-label="Next product photo" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-neutral-800 shadow-lg transition hover:scale-105 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-neutral-900/90 dark:text-white dark:hover:bg-neutral-800"><ChevronRight className="h-5 w-5" /></button></>}
                  {popupImages.length > 0 && <span className="absolute bottom-3 right-3 rounded-full bg-neutral-950/70 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur">{selectedImage + 1} / {popupImages.length}</span>}
                </div>
                {popupImages.length > 1 && <div className="flex shrink-0 gap-2 overflow-x-auto border-t border-neutral-200/70 bg-white/70 p-3 dark:border-white/10 dark:bg-[#111113]/80 sm:p-4">{popupImages.map((photo, index) => <button key={`${photo.id || photo.url}-${index}`} type="button" onClick={() => setSelectedImage(index)} aria-label={`Show photo ${index + 1}`} aria-pressed={selectedImage === index} className={`h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-neutral-100 outline-none ring-offset-2 transition focus-visible:ring-2 focus-visible:ring-teal-600 dark:bg-white/10 dark:ring-offset-[#111113] sm:h-16 sm:w-16 ${selectedImage === index ? 'ring-2 ring-teal-600' : 'ring-1 ring-black/5 dark:ring-white/10'}`}><img src={imageUrl(photo.url)} alt="" className="h-full w-full object-cover" /></button>)}</div>}
              </section>

              <section className="min-h-0 overflow-y-auto border-t border-neutral-100 dark:border-white/10 md:border-l md:border-t-0">
                <div className="space-y-6 p-5 sm:p-7">
                  {popupError && <div role="alert" className="rounded-2xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:bg-amber-500/10 dark:text-amber-200">{popupError} Showing the product information already available.</div>}
                  <div><div className="flex flex-wrap items-center gap-2"><Badge tone={STATUS_TONE[selectedProduct.status] || 'neutral'}>{selectedProduct.status || 'Product'}</Badge>{selectedProduct.isFeatured && <Badge tone="warning"><Tag className="h-3 w-3" /> Featured</Badge>}</div><h3 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-white">{selectedProduct.name || 'Untitled product'}</h3><p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">{selectedProduct.category || selectedProduct.categoryName || 'No category'}{selectedProduct.metalType ? ` · ${selectedProduct.metalType}` : ''}{selectedProduct.purity ? ` · ${selectedProduct.purity}` : ''}</p></div>
                  <div className="grid grid-cols-2 gap-3"><div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/[0.04]"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Price</p><p className="mt-1.5 text-sm font-semibold text-neutral-950 dark:text-white">{detail?.priceLabel ?? (popupLoading ? 'Loading…' : 'Rate based')}</p></div><div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/[0.04]"><p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-400">Stock</p><p className="mt-1.5 text-sm font-semibold text-neutral-950 dark:text-white">{detail ? `${formatNumber(detail.totalStock)} units` : popupLoading ? 'Loading…' : '—'}</p></div></div>
                  {selectedProduct.description && <div><h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Description</h4><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700 dark:text-neutral-300">{selectedProduct.description}</p></div>}
                  {detail?.variants?.length > 0 && <div><div className="flex items-center justify-between"><h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Variants</h4><span className="text-[11px] text-neutral-400">{detail.variants.length} options</span></div><ul className="mt-2 divide-y divide-neutral-100 rounded-2xl border border-neutral-100 dark:divide-white/10 dark:border-white/10">{detail.variants.map((variant) => <li key={variant.id || variant.sku} className="flex items-center justify-between gap-3 px-3.5 py-3"><span className="min-w-0"><span className="block truncate text-sm font-medium text-neutral-800 dark:text-neutral-200">{variant.optionLabel || variant.sku || 'Variant'}</span><span className="mt-0.5 block truncate text-[11px] text-neutral-400">{variant.sku || 'No SKU'} · {variant.availability?.replaceAll('_', ' ') || 'available'}</span></span><span className="shrink-0 text-right text-xs font-semibold text-neutral-800 dark:text-neutral-200">{variant.fixedPrice == null ? 'Rate based' : formatPKR(variant.fixedPrice)}<span className="mt-0.5 block text-[10px] font-normal text-neutral-400">{formatNumber(variant.stockQuantity)} in stock</span></span></li>)}</ul></div>}
                  {(selectedProduct.brand || selectedProduct.collectionName || selectedProduct.finishColor || selectedProduct.seoTitle) && <div className="grid grid-cols-2 gap-x-4 gap-y-3 border-t border-neutral-100 pt-4 dark:border-white/10">{[[selectedProduct.brand, 'Brand'], [selectedProduct.collectionName, 'Collection'], [selectedProduct.finishColor, 'Finish'], [selectedProduct.seoTitle, 'SEO title']].filter(([value]) => value).map(([value, label]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-neutral-400">{label}</p><p className="mt-1 truncate text-xs text-neutral-700 dark:text-neutral-300">{value}</p></div>)}</div>}
                  <div className="flex items-center justify-between border-t border-neutral-100 pt-4 text-[11px] text-neutral-400 dark:border-white/10"><span>Updated {selectedProduct.updated_at || selectedProduct.updatedAt || '—'}</span><span className="inline-flex items-center gap-1"><Check className="h-3 w-3 text-emerald-600" /> Saved product</span></div>
                  <Link to={`/admin/products/${selectedProduct.id}/edit`} onClick={closeDetail} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full bg-neutral-950 text-xs font-semibold text-white transition hover:bg-neutral-800 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200 sm:hidden">Edit product <ArrowRight className="h-3.5 w-3.5" /></Link>
                </div>
              </section>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
