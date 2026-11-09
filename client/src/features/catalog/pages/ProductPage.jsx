import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Gem, ImageOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { publicProducts } from '../../../lib/api.js';
import { useStoreBrand } from '../../../contexts/StoreBrandContext.jsx';

const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
const money = (amount) => `PKR ${pkr.format(Number(amount || 0))}`;
const absoluteImage = (url) => url?.startsWith('http') ? url : `${window.location.origin}${url || ''}`;

export default function ProductPage() {
  const { slug } = useParams();
  const { storeName } = useStoreBrand();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setError('');
    publicProducts.get(slug)
      .then((result) => {
        if (!cancelled) {
          setProduct(result);
          setSelectedVariant(String(result.variants?.[0]?.id || ''));
          setSelectedImage(0);
        }
      })
      .catch((failure) => {
        if (!cancelled && failure.name !== 'AbortError') {
          setProduct(null);
          setError(failure.message || 'This product could not be found.');
        }
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [slug]);

  const variant = product?.variants?.find((row) => String(row.id) === selectedVariant) || product?.variants?.[0];
  const description = product?.seoDescription || product?.description || '';
  const title = product?.seoTitle ? `${product.seoTitle} | ${storeName}` : product ? `${product.name} | ${storeName}` : storeName;
  const canonical = `${window.location.origin}/shop/${encodeURIComponent(slug)}`;

  const prices = useMemo(() => {
    if (!product) return [];
    return product.variants.map((row) => row.fixedPrice).filter((value) => Number.isFinite(Number(value)) && Number(value) > 0);
  }, [product]);

  const canOrder = variant?.availability !== 'unavailable' && variant?.rateAvailable !== false;

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 text-sm text-stone-500">
        <span><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading product…</span>
      </main>
    );
  }
  if (error || !product) {
    return (
      <main className="grid min-h-screen place-items-center bg-stone-50 px-5 text-center text-stone-900">
        <div><ImageOff className="mx-auto h-8 w-8 text-stone-400" /></div>
        <h1 className="mt-4 text-2xl font-semibold">Product unavailable</h1>
        <p className="mt-2 text-sm text-stone-500">{error}</p>
        <Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white"><ArrowLeft className="h-4 w-4" />Back to shop</Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <title>{title}</title>
      <section className="mx-auto max-w-7xl px-6 py-8 lg:py-16">
        <div className="lg:grid lg:grid-cols-2 lg:gap-12">
          <div className="space-y-4">
            <div className="aspect-[4/5] overflow-hidden rounded-xl bg-stone-200">
              <img src={absoluteImage(product.images?.[0]?.url)} alt={product.name} className="h-full w-full object-cover" />
            </div>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((photo, index) => (
                  <button key={photo.url} onClick={() => setSelectedImage(index)} className={`aspect-square overflow-hidden rounded-lg border ${selectedImage === index ? 'border-amber-700' : 'border-transparent'}`}>
                    <img src={photo.url} alt={photo.altText || product.name} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">{product.category || 'Fine jewelry'}{product.collectionName ? ` · ${product.collectionName}` : ''}</p>
              <h1 className="mt-2 text-3xl font-light leading-tight tracking-tight sm:text-4xl">{product.name}</h1>
              {product.brand && <p className="mt-2 text-sm text-stone-500">By {product.brand}</p>}
            </div>
            <div>
              <p className="mt-5 text-2xl font-medium">{variant?.fixedPrice ? money(variant.fixedPrice) : variant?.pricingMode === 'metal_weight' ? 'Price unavailable' : 'Contact us for a quote'}</p>
              <p className="mt-1 text-xs text-stone-500">{variant?.pricingMode === 'metal_weight' ? `Includes ${product.purity} ${product.metalType} and making charge` : 'Price shown in Pakistani rupees'}</p>
            </div>
            <div className="my-4 h-px bg-stone-200" />
            {product.variants.length > 1 && <label className="block text-sm font-medium">Choose an option</label>}
            {product.variants.length > 1 && (
              <select value={selectedVariant} onChange={(e) => setSelectedVariant(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-amber-700">
                {product.variants.map((row) => <option key={row.id} value={row.id}>{row.optionLabel} {row.availability === 'unavailable' ? '· Unavailable' : ''}</option>)}
              </select>
            )}
            {!canOrder && (
              <p role="status" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{variant?.rateAvailable === false ? 'We are updating the metal rate for this product. Please check back soon.' : 'This option is currently unavailable.'}</p>
            )}
            <Link to="/custom-order" className={`mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full px-6 text-sm font-medium transition ${canOrder ? 'bg-stone-900 text-white hover:bg-stone-800' : 'pointer-events-none bg-stone-200 text-stone-500'}`}>{variant?.availability === 'made_to_order' ? 'Request this piece' : 'Enquire about this piece'}<ArrowRight className="h-4 w-4" /></Link>
            <p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><ShieldCheck className="h-4 w-4 text-emerald-700" />Made with care in Pakistan</p>
            <div className="mt-8 space-y-4 border-t border-stone-200 pt-6">
              <div>
                <h2 className="text-sm font-semibold">About this piece</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.description}</p>
              </div>
              {product.stoneMaterials && <div><h3 className="text-xs font-semibold text-stone-800">Stone & materials</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.stoneMaterials}</p></div>}
              {product.finishColor && <div><h3 className="text-xs font-semibold text-stone-800">Finish</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.finishColor}</p></div>}
              {variant?.weightGrams && <div><h3 className="text-xs font-semibold text-stone-800">Approx. weight</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{variant.weightGrams} g</p></div>}
              {product.careInstructions && <div><h3 className="text-xs font-semibold text-stone-800">Care instructions</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.careInstructions}</p></div>}
            </div>
          </div>
        </div>
      </section>
      <footer className="border-t border-stone-200 px-6 py-6 text-center text-xs text-stone-500">Quetta, Pakistan · {storeName}</footer>
    </main>
  );
}
