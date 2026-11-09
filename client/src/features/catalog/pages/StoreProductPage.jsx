import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ArrowRight, Gem, ImageOff, LoaderCircle, ShieldCheck } from 'lucide-react';
import { useCart } from '../../cart/CartContext.jsx';
import { useStoreBrand } from '../../../contexts/StoreBrandContext.jsx';

const pkr = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });
const money = (amount) => `PKR ${pkr.format(Number(amount || 0))}`;
const absoluteImage = (url) => url?.startsWith('http') ? url : `${window.location.origin}${url || ''}`;

export default function StoreProductPage() {
  const { slug } = useParams();
  const { storeName } = useStoreBrand();
  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState('');
  const [selectedImage, setSelectedImage] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [added, setAdded] = useState(false);
  const { addItem } = useCart();

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError('');
    fetch(`/api/products/${encodeURIComponent(slug)}`, { headers: { Accept: 'application/json' }, signal: controller.signal })
      .then(async (response) => {
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || 'This product could not be found.');
        return result;
      })
      .then((result) => { setProduct(result); setSelectedVariant(String(result.variants?.[0]?.id || '')); setSelectedImage(0); setImageFailed(false); })
      .catch((failure) => { if (failure.name !== 'AbortError') { setProduct(null); setError(failure.message); } })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [slug]);

  const variants = Array.isArray(product?.variants) ? product.variants : [];
  const images = Array.isArray(product?.images) ? product.images : [];
  const variant = variants.find((row) => String(row.id) === selectedVariant) || variants[0];
  const description = product?.seoDescription || product?.description || '';
  const title = product?.seoTitle ? `${product.seoTitle} | ${storeName}` : product ? `${product.name} | ${storeName}` : storeName;
  const canonical = `${window.location.origin}/shop/${encodeURIComponent(slug)}`;
  const structuredData = useMemo(() => {
    if (!product) return null;
    const productImages = Array.isArray(product.images) ? product.images : [];
    const productVariants = Array.isArray(product.variants) ? product.variants : [];
    const prices = productVariants.map((row) => row.fixedPrice).filter((value) => Number.isFinite(Number(value)) && Number(value) > 0);
    return {
      '@context': 'https://schema.org', '@type': 'Product', name: product.name, description,
      image: productImages.map((image) => absoluteImage(image.url)), sku: variant?.sku,
      brand: { '@type': 'Brand', name: product.brand || storeName },
      category: product.category,
      material: [product.metalType, product.purity, product.stoneMaterials, product.finishColor].filter(Boolean).join(', '),
      offers: prices.length ? { '@type': 'AggregateOffer', priceCurrency: 'PKR', lowPrice: Math.min(...prices), highPrice: Math.max(...prices), offerCount: prices.length, availability: productVariants.some((row) => row.availability !== 'unavailable') ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock' } : undefined,
    };
  }, [product, description, variant?.sku, storeName]);

  if (loading) return <main className="grid min-h-screen place-items-center bg-stone-50 text-sm text-stone-500"><span><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" />Loading product…</span></main>;
  if (error || !product) return <main className="grid min-h-screen place-items-center bg-stone-50 px-5 text-center text-stone-900"><div><ImageOff className="mx-auto h-8 w-8 text-stone-400" /><h1 className="mt-4 text-2xl font-semibold">Product unavailable</h1><p className="mt-2 text-sm text-stone-500">{error || 'This product is no longer available.'}</p><Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-stone-900 px-5 py-2.5 text-sm text-white"><ArrowLeft className="h-4 w-4" />Back to shop</Link></div></main>;

  const image = images[selectedImage];
  const hasInventory = variant?.availability === 'made_to_order' || (variant?.availability === 'available' && variant?.availableQuantity > 0);
  const canOrder = hasInventory && variant?.rateAvailable !== false && Number(variant?.fixedPrice) > 0;
  function addToBag() {
    addItem(product, variant, 1);
    setAdded(true);
    window.setTimeout(() => setAdded(false), 2400);
  }
  const productJson = JSON.stringify(structuredData).replace(/</g, '\\u003c');

  return (
    <main className="min-h-screen bg-[#fbfaf8] text-stone-900">
      <title>{title}</title>
      <meta name="description" content={description.slice(0, 160)} />
      <link rel="canonical" href={canonical} />
      <meta property="og:type" content="product" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description.slice(0, 160)} />
      {image && <meta property="og:image" content={absoluteImage(image.url)} />}
      <meta property="og:url" content={canonical} />
      {structuredData && <script type="application/ld+json">{productJson}</script>}

      <div className="mx-auto max-w-7xl px-5 pb-14 sm:px-8"><Link to="/shop" className="inline-flex items-center gap-1.5 py-3 text-xs text-stone-500 hover:text-stone-950"><ArrowLeft className="h-3.5 w-3.5" /> All jewelry</Link>
        <div className="mt-4 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <section aria-label="Product photos" className="min-w-0"><div className="flex aspect-square items-center justify-center overflow-hidden rounded-[2rem] bg-gradient-to-br from-stone-100 to-amber-50">{image && !imageFailed ? <img src={image.url} alt={image.altText || product.name} onError={() => setImageFailed(true)} className="h-full w-full object-cover" /> : <Gem className="h-16 w-16 text-stone-300" />}</div>{images.length > 1 && <div className="mt-3 flex gap-3 overflow-x-auto pb-2">{images.map((photo, index) => <button key={`${photo.url}-${index}`} type="button" aria-label={`View photo ${index + 1}`} aria-pressed={selectedImage === index} onClick={() => { setSelectedImage(index); setImageFailed(false); }} className={`h-20 w-20 shrink-0 overflow-hidden rounded-xl ring-2 ring-offset-2 ring-offset-[#fbfaf8] ${selectedImage === index ? 'ring-amber-700' : 'ring-transparent'}`}><img src={photo.url} alt={photo.altText || `${product.name} photo ${index + 1}`} onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }} className="h-full w-full object-cover" /></button>)}</div>}</section>

          <section className="flex flex-col py-1 lg:py-8"><p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-800">{product.category || 'Fine jewelry'}{product.collectionName ? ` · ${product.collectionName}` : ''}</p><h1 className="mt-3 text-3xl font-light leading-tight tracking-tight sm:text-4xl">{product.name}</h1>{product.brand && <p className="mt-2 text-sm text-stone-500">By {product.brand}</p>}<p className="mt-5 text-2xl font-medium">{variant?.fixedPrice ? money(variant.fixedPrice) : variant?.pricingMode === 'metal_weight' ? 'Price unavailable' : 'Contact us for a quote'}</p><p className="mt-1 text-xs text-stone-500">{variant?.pricingMode === 'metal_weight' ? `Includes ${product.purity} ${product.metalType} and making charge` : 'Price shown in Pakistani rupees'}</p>
            <div className="my-6 h-px bg-stone-200" />
            {variants.length > 1 && <label className="block text-sm font-medium">Choose an option<select value={selectedVariant} onChange={(event) => setSelectedVariant(event.target.value)} className="mt-2 h-12 w-full rounded-xl border border-stone-300 bg-white px-3 text-sm outline-none focus:border-amber-700">{variants.map((row) => <option key={row.id} value={row.id}>{row.optionLabel} {row.availability === 'unavailable' ? '· Unavailable' : ''}</option>)}</select></label>}
            {!canOrder && <p role="status" className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">{variant?.rateAvailable === false ? 'We are updating the metal rate for this product. Contact us for the current price.' : 'This option is currently unavailable. Contact us to ask about a similar piece.'}</p>}
            {canOrder ? <div className="mt-6 flex flex-wrap items-center gap-3"><button type="button" onClick={addToBag} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-7 text-sm font-medium text-white transition hover:bg-stone-700">{added ? 'Added to bag' : 'Add to bag'}<ArrowRight className="h-4 w-4" /></button>{added && <Link to="/cart" className="text-sm font-medium text-amber-800 underline underline-offset-4">View bag</Link>}</div> : <Link to="/custom-order" className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-stone-900 px-6 text-sm font-medium text-white transition hover:bg-stone-700">{variant?.availability === 'made_to_order' ? 'Request this piece' : 'Enquire about this piece'}<ArrowRight className="h-4 w-4" /></Link>}
            <p className="mt-4 flex items-center gap-2 text-xs text-stone-500"><ShieldCheck className="h-4 w-4 text-emerald-700" />Made with care in Pakistan</p>
            <div className="mt-8 space-y-4 border-t border-stone-200 pt-6"><div><h2 className="text-sm font-semibold">About this piece</h2><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-600">{product.description}</p></div>{product.stoneMaterials && <Detail label="Stone & materials" value={product.stoneMaterials} />}{product.finishColor && <Detail label="Finish" value={product.finishColor} />}{variant?.weightGrams && <Detail label="Approx. weight" value={`${variant.weightGrams} g`} />}{product.careInstructions && <Detail label="Care instructions" value={product.careInstructions} />}</div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Detail({ label, value }) { return <div><h3 className="text-xs font-semibold text-stone-800">{label}</h3><p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-stone-600">{value}</p></div>; }
