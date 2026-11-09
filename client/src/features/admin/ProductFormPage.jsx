import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Check, Eye, Gem, ImagePlus, LoaderCircle, Plus, Save, Search, Sparkles, Trash2 } from 'lucide-react';
import { adminProducts } from '../../lib/api.js';
import { useStoreBrand } from '../../contexts/StoreBrandContext.jsx';
import { Badge, Card } from './dashboard/components/ui.jsx';

const blankVariant = () => ({ sku: '', optionLabel: 'Default', weightGrams: '', pricingMode: 'fixed', fixedPrice: '', makingChargeType: 'fixed', makingCharge: '0', stockQuantity: '0', availability: 'available', optionValues: [] });
const blankProduct = () => ({ name: '', slug: '', categoryName: '', description: '', productMode: 'ready_made', metalType: 'gold', purity: '', status: 'draft', brand: '', collectionName: '', stoneMaterials: '', finishColor: '', careInstructions: '', tags: [], isFeatured: false, seoTitle: '', seoDescription: '', images: [], variants: [blankVariant()] });
const steps = [
  ['basic', 'Basic information'], ['materials', 'Materials'], ['photos', 'Photos'],
  ['variants', 'Options & variants'], ['pricing', 'Pricing & stock'], ['search', 'Search & display'], ['review', 'Review & publish'],
];

function slugify(value) {
  return String(value || '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function Input({ label, help, className = '', ...props }) {
  return <label className={`block text-sm font-medium text-neutral-700 dark:text-neutral-200 ${className}`}>{label}<input {...props} className={`mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-normal outline-none transition placeholder:text-neutral-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#101012] dark:text-white ${props.className || ''}`} />{help && <span className="mt-1 block text-xs font-normal text-neutral-400">{help}</span>}</label>;
}

function Textarea({ label, help, ...props }) {
  return <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}<textarea {...props} className={`mt-1.5 w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm font-normal leading-relaxed outline-none transition placeholder:text-neutral-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#101012] dark:text-white ${props.className || ''}`} />{help && <span className="mt-1 block text-xs font-normal text-neutral-400">{help}</span>}</label>;
}

function Select({ label, children, ...props }) {
  return <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-200">{label}<select {...props} className="mt-1.5 h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm font-normal outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/10 dark:border-white/10 dark:bg-[#101012] dark:text-white">{children}</select></label>;
}

function Section({ id, number, title, description, children }) {
  return <Card id={id} className="scroll-mt-5 p-5 sm:p-7"><div className="flex gap-3"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-teal-700/10 text-xs font-bold text-teal-800 dark:bg-teal-300/15 dark:text-teal-300">{number}</span><div><h2 className="text-lg font-semibold tracking-tight text-neutral-950 dark:text-white">{title}</h2>{description && <p className="mt-0.5 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">{description}</p>}</div></div><div className="mt-6 space-y-5">{children}</div></Card>;
}

function fileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
    reader.readAsDataURL(file);
  });
}

export default function ProductFormPage() {
  const { storeName } = useStoreBrand();
  const { productId } = useParams();
  const editing = Boolean(productId);
  const [product, setProduct] = useState(blankProduct);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(editing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [details, setDetails] = useState([]);
  const [notice, setNotice] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [previews, setPreviews] = useState({});

  useEffect(() => {
    let active = true;
    adminProducts.categories().then((result) => { if (active) setCategories(result.items || []); }).catch(() => {});
    if (!editing) return () => { active = false; };
    adminProducts.get(productId)
      .then((result) => {
        if (!active) return;
        setProduct({
          ...blankProduct(), ...result,
          slug: result.slug || '', tags: Array.isArray(result.tags) ? result.tags : [],
          images: result.images || [], variants: result.variants?.length ? result.variants : [blankVariant()],
        });
        setSlugEdited(true);
      })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [editing, productId]);

  useEffect(() => {
    let active = true;
    const requests = product.variants.map(async (variant, index) => {
      if (variant.pricingMode !== 'metal_weight' || !variant.weightGrams || !product.metalType || !product.purity) return [index, null];
      try {
        const result = await adminProducts.previewPrice({ metal: product.metalType, purity: product.purity, weightGrams: variant.weightGrams, makingChargeType: variant.makingChargeType, makingCharge: variant.makingCharge });
        return [index, result];
      } catch { return [index, null]; }
    });
    Promise.all(requests).then((results) => { if (active) setPreviews(Object.fromEntries(results.filter(([, value]) => value))); });
    return () => { active = false; };
  }, [product.metalType, product.purity, JSON.stringify(product.variants.map(({ pricingMode, weightGrams, makingChargeType, makingCharge }) => ({ pricingMode, weightGrams, makingChargeType, makingCharge })))]);

  const setField = (key, value) => setProduct((current) => ({ ...current, [key]: value }));
  const generatedSlug = useMemo(() => product.slug || slugify(product.name), [product.slug, product.name]);
  const readyToPublish = Boolean(product.name.trim() && product.categoryName.trim() && product.description.trim() && product.images.length && product.variants.length && product.variants.every((variant, index) => variant.sku.trim() && Number(variant.weightGrams) > 0 && (variant.pricingMode === 'metal_weight' ? previews[index]?.available : Number(variant.fixedPrice) > 0)) && (!['gold', 'silver'].includes(product.metalType) || product.purity.trim()));

  function changeVariant(index, key, value) {
    setProduct((current) => ({ ...current, variants: current.variants.map((variant, row) => row === index ? { ...variant, [key]: value } : variant) }));
  }

  async function addPhotos(event) {
    const files = [...(event.target.files || [])];
    event.target.value = '';
    try {
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0) + product.images.reduce((sum, image) => sum + (image.fileSize || 0), 0);
      if (totalBytes > 10 * 1024 * 1024) throw new Error('Keep the total photo upload size under 10 MB per save.');
      for (const file of files) {
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Use JPEG, PNG or WebP photos.');
        if (file.size > 4 * 1024 * 1024) throw new Error(`${file.name} is larger than 4 MB.`);
      }
      const added = await Promise.all(files.map(async (file) => ({ dataUrl: await fileAsDataUrl(file), altText: '', fileName: file.name, fileSize: file.size })));
      setProduct((current) => ({ ...current, images: [...current.images, ...added] }));
      setError('');
    } catch (failure) { setError(failure.message); }
  }

  function moveImage(index, direction) {
    setProduct((current) => {
      const images = [...current.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return current;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...current, images };
    });
  }

  async function save(status) {
    setSaving(true); setError(''); setDetails([]); setNotice('');
    try {
      const payload = {
        ...product, slug: generatedSlug, status,
        tags: Array.isArray(product.tags) ? product.tags : String(product.tags || '').split(',').map((tag) => tag.trim()).filter(Boolean),
        variants: product.variants.map((variant) => ({ ...variant, weightGrams: variant.weightGrams === '' ? null : Number(variant.weightGrams), fixedPrice: variant.fixedPrice === '' ? null : Number(variant.fixedPrice), stockQuantity: Number(variant.stockQuantity), makingCharge: Number(variant.makingCharge) })),
        images: product.images.map(({ id, url, dataUrl, altText }) => ({ id, url, dataUrl, altText })),
      };
      const result = editing ? await adminProducts.update(productId, payload) : await adminProducts.create(payload);
      if (editing) {
        setProduct({ ...blankProduct(), ...result, images: result.images || [], variants: result.variants?.length ? result.variants : [blankVariant()] });
        setSlugEdited(true);
        setNotice(status === 'published' ? 'Product published. Your SEO fields and photo alt text are saved.' : status === 'archived' ? 'Product archived.' : 'Draft saved.');
      } else {
        setProduct(blankProduct());
        setSlugEdited(false);
        setNotice(status === 'published' ? 'Product published.' : 'Draft saved.');
      }
    } catch (failure) { setError(failure.message); setDetails(failure.details || []); }
    finally { setSaving(false); }
  }

  if (loading) return <div className="grid min-h-72 place-items-center text-sm text-neutral-500"><LoaderCircle className="mr-2 inline h-4 w-4 animate-spin" /> Loading product…</div>;

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div><Link to="/admin/products" className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-500 hover:text-neutral-950 dark:hover:text-white"><ArrowLeft className="h-3.5 w-3.5" /> Products</Link><h1 className="mt-2 text-3xl font-semibold tracking-tight text-neutral-950 dark:text-white">{editing ? 'Edit product' : 'Add product'}</h1><p className="mt-1 text-sm text-neutral-500 dark:text-neutral-400">Build the product, options and search preview in one place.</p></div>
        <div className="flex items-center gap-2"><Badge tone={product.status === 'published' ? 'success' : product.status === 'archived' ? 'neutral' : 'warning'}>{product.status}</Badge>{editing && product.status !== 'archived' && <button type="button" onClick={() => save('archived')} disabled={saving} className="h-10 rounded-full border border-neutral-200 px-4 text-xs font-medium text-neutral-600 hover:border-red-200 hover:text-red-700 disabled:opacity-50 dark:border-white/10 dark:text-neutral-300">Archive</button>}</div>
      </div>

      {error && <div role="alert" className="rounded-2xl bg-red-50 p-4 ring-1 ring-red-100 dark:bg-red-500/10 dark:ring-red-500/20"><div className="flex gap-2 text-sm font-medium text-red-800 dark:text-red-300"><AlertTriangle className="h-4 w-4 shrink-0" />{error}</div>{details.length > 0 && <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-red-700 dark:text-red-200">{details.map((item) => <li key={item}>{item}</li>)}</ul>}</div>}
      {notice && <p role="status" className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300">{notice}</p>}

      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="space-y-5">
          <Section id="basic" number="1" title="Basic information" description="Give the product a clear name and tell customers what it is.">
            <Input label="Product name *" required maxLength={180} placeholder="e.g. 22K Gold Floral Ring" value={product.name} onChange={(event) => setField('name', event.target.value)} />
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Category *" required list="product-category-options" placeholder="Ring, necklace, chain…" value={product.categoryName} onChange={(event) => setField('categoryName', event.target.value)} /><datalist id="product-category-options">{categories.map((category) => <option key={category.id} value={category.name} />)}</datalist><Select label="Product type" value={product.productMode} onChange={(event) => setField('productMode', event.target.value)}><option value="ready_made">Ready-made</option><option value="custom_made">Custom-made</option><option value="both">Both</option></Select></div>
            <Textarea label="Description *" required rows={5} maxLength={10000} placeholder="Describe the design, craftsmanship and what is included…" value={product.description} onChange={(event) => setField('description', event.target.value)} help={`${product.description.length}/10,000 characters`} />
          </Section>

          <Section id="materials" number="2" title="Materials" description="Set the metal and purity used for rate-based pricing.">
            <div className="grid gap-5 sm:grid-cols-2"><Select label="Metal" value={product.metalType} onChange={(event) => setField('metalType', event.target.value)}><option value="gold">Gold</option><option value="silver">Silver</option><option value="other">Other</option></Select><Input label="Purity" placeholder={product.metalType === 'silver' ? 'e.g. 925' : 'e.g. 22K'} value={product.purity} onChange={(event) => setField('purity', event.target.value)} help="Required for gold and silver products." /></div>
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Brand" maxLength={120} placeholder="Optional" value={product.brand || ''} onChange={(event) => setField('brand', event.target.value)} /><Input label="Collection" maxLength={120} placeholder="Optional" value={product.collectionName || ''} onChange={(event) => setField('collectionName', event.target.value)} /></div>
            <Textarea label="Stone or material details" rows={2} placeholder="e.g. Natural emerald, freshwater pearls" value={product.stoneMaterials || ''} onChange={(event) => setField('stoneMaterials', event.target.value)} />
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Finish or color" maxLength={120} placeholder="e.g. High polish, rose gold" value={product.finishColor || ''} onChange={(event) => setField('finishColor', event.target.value)} /><Textarea label="Care instructions" rows={2} placeholder="Optional customer care notes" value={product.careInstructions || ''} onChange={(event) => setField('careInstructions', event.target.value)} /></div>
          </Section>

          <Section id="photos" number="3" title="Product photos" description="Upload JPEG, PNG or WebP images. The first photo is the primary listing image.">
            <label className="flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/70 p-5 text-center transition hover:border-teal-600 hover:bg-teal-50/40 dark:border-white/15 dark:bg-white/[0.02] dark:hover:bg-teal-500/5"><ImagePlus className="h-6 w-6 text-teal-700 dark:text-teal-300" /><span className="mt-2 text-sm font-semibold text-neutral-800 dark:text-neutral-100">Choose product photos</span><span className="mt-1 text-xs text-neutral-500">Up to 4 MB per image; 10 MB per save</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={addPhotos} /></label>
            {product.images.length > 0 && <div className="space-y-3">{product.images.map((image, index) => <div key={image.id || image.dataUrl || index} className="flex flex-col gap-3 rounded-2xl border border-neutral-200 p-3 sm:flex-row sm:items-center dark:border-white/10"><img src={image.url || image.dataUrl} alt={image.altText || ''} className="h-20 w-20 shrink-0 rounded-xl bg-neutral-100 object-cover dark:bg-white/10" /><div className="min-w-0 flex-1"><Input label="Photo alt text" maxLength={200} placeholder="Describe this image for accessibility and image search" value={image.altText || ''} onChange={(event) => setProduct((current) => ({ ...current, images: current.images.map((row, i) => i === index ? { ...row, altText: event.target.value } : row) }))} />{index === 0 && <span className="mt-1 inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300"><Check className="h-3 w-3" /> Primary photo</span>}</div><div className="flex shrink-0 items-center gap-1"><button type="button" disabled={index === 0} onClick={() => moveImage(index, -1)} aria-label="Move photo earlier" className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowUp className="h-4 w-4" /></button><button type="button" disabled={index === product.images.length - 1} onClick={() => moveImage(index, 1)} aria-label="Move photo later" className="grid h-9 w-9 place-items-center rounded-full text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:hover:bg-white/10"><ArrowDown className="h-4 w-4" /></button><button type="button" onClick={() => setField('images', product.images.filter((_, i) => i !== index))} aria-label="Remove photo" className="grid h-9 w-9 place-items-center rounded-full text-neutral-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"><Trash2 className="h-4 w-4" /></button></div></div>)}</div>}
            {!product.images.length && <p className="text-xs text-amber-700 dark:text-amber-300">At least one product photo is required before publishing.</p>}
          </Section>

          <Section id="variants" number="4" title="Options and variants" description="Create a variant for every sellable size, length, or other choice. A product without options still needs a default variant.">
            {product.variants.map((variant, index) => <div key={variant.id || `variant-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="mb-4 flex items-center justify-between"><p className="text-sm font-semibold text-neutral-900 dark:text-white">Variant {index + 1}</p>{product.variants.length > 1 && <button type="button" onClick={() => setField('variants', product.variants.filter((_, row) => row !== index))} className="inline-flex items-center gap-1 text-xs text-neutral-400 hover:text-red-600"><Trash2 className="h-3.5 w-3.5" /> Remove</button>}</div><div className="grid gap-4 sm:grid-cols-2"><Input label="Variant label *" placeholder="Default, Size 7, 18-inch chain" value={variant.optionLabel || ''} onChange={(event) => changeVariant(index, 'optionLabel', event.target.value)} /><Input label="SKU / product code *" required maxLength={80} placeholder="e.g. RING-22K-07" value={variant.sku} onChange={(event) => changeVariant(index, 'sku', event.target.value)} /><Input label="Weight (grams)" type="number" min="0" step="0.001" value={variant.weightGrams} onChange={(event) => changeVariant(index, 'weightGrams', event.target.value)} /><Select label="Availability" value={variant.availability} onChange={(event) => changeVariant(index, 'availability', event.target.value)}><option value="available">Available</option><option value="unavailable">Unavailable</option><option value="made_to_order">Made to order</option></Select><Input className="sm:col-span-2" label="Option values" placeholder="Optional values, separated by commas (e.g. Size 7, Gold)" value={(variant.optionValues || []).join(', ')} onChange={(event) => changeVariant(index, 'optionValues', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))} /></div></div>)}
            <button type="button" onClick={() => setField('variants', [...product.variants, blankVariant()])} className="inline-flex items-center gap-2 rounded-full border border-neutral-200 px-4 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"><Plus className="h-3.5 w-3.5" /> Add variant</button>
          </Section>

          <Section id="pricing" number="5" title="Pricing and stock" description="Each variant uses one pricing method. Rate-based prices update from the latest published rate.">
            {product.variants.map((variant, index) => <div key={variant.id || `price-${index}`} className="rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><div className="mb-4 flex flex-wrap items-center justify-between gap-2"><p className="text-sm font-semibold text-neutral-900 dark:text-white">{variant.optionLabel || `Variant ${index + 1}`}</p><span className="text-xs text-neutral-400">SKU {variant.sku || 'not set'}</span></div><div className="grid gap-4 sm:grid-cols-2"><Select label="Pricing method" value={variant.pricingMode} onChange={(event) => changeVariant(index, 'pricingMode', event.target.value)}><option value="fixed">Fixed price</option><option value="metal_weight">Metal weight + making charge</option></Select><Input label="On-hand quantity" type="number" min="0" step="1" value={variant.stockQuantity} readOnly help="Receive or adjust stock from Inventory to keep an auditable count." />{variant.pricingMode === 'fixed' ? <Input className="sm:col-span-2" label="Price (PKR) *" type="number" min="0.01" step="0.01" value={variant.fixedPrice} onChange={(event) => changeVariant(index, 'fixedPrice', event.target.value)} /> : <><Select label="Making-charge method" value={variant.makingChargeType} onChange={(event) => changeVariant(index, 'makingChargeType', event.target.value)}><option value="fixed">Fixed amount</option><option value="per_gram">Per gram</option></Select><Input label={`Making charge (PKR${variant.makingChargeType === 'per_gram' ? ' / g' : ''})`} type="number" min="0" step="0.01" value={variant.makingCharge} onChange={(event) => changeVariant(index, 'makingCharge', event.target.value)} /></>}</div>{variant.pricingMode === 'metal_weight' && <div className={`mt-4 rounded-2xl p-4 ${previews[index]?.available ? 'bg-teal-50/70 dark:bg-teal-500/10' : 'bg-amber-50 dark:bg-amber-500/10'}`}>{previews[index]?.available ? <><div className="flex items-center gap-2 text-xs font-semibold text-teal-800 dark:text-teal-200"><Sparkles className="h-4 w-4" /> Price breakdown · rate PKR {Number(previews[index].ratePerGram).toLocaleString()} / g</div><div className="mt-3 grid grid-cols-3 gap-2 text-xs text-teal-900 dark:text-teal-100"><div><p className="opacity-70">Metal value</p><p className="mt-1 font-semibold">PKR {Number(previews[index].metalValue).toLocaleString()}</p></div><div><p className="opacity-70">Making charge</p><p className="mt-1 font-semibold">PKR {Number(previews[index].makingCharge).toLocaleString()}</p></div><div><p className="opacity-70">Item price</p><p className="mt-1 font-semibold">PKR {Number(previews[index].calculatedPrice).toLocaleString()}</p></div></div></> : <p className="flex items-start gap-2 text-xs leading-relaxed text-amber-800 dark:text-amber-200"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />{previews[index]?.warning || `Enter the product's ${product.metalType} purity and this variant's weight to preview pricing. A published rate is required before publishing.`}</p>}</div>}</div>)}
          </Section>

          <Section id="search" number="6" title="Search and display" description="Help shoppers discover this product and control how it appears in search results.">
            <Input label="SKU / product code" value="Managed on each variant" readOnly help="Each sellable option has a unique SKU. Search works across all variant codes." />
            <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-neutral-200 p-4 dark:border-white/10"><input type="checkbox" checked={Boolean(product.isFeatured)} onChange={(event) => setField('isFeatured', event.target.checked)} className="mt-0.5 h-4 w-4 accent-teal-700" /><span><span className="block text-sm font-semibold text-neutral-900 dark:text-white">Feature on the homepage</span><span className="mt-0.5 block text-xs text-neutral-500">Featured products can be highlighted in storefront collections.</span></span></label>
            <div className="grid gap-5 sm:grid-cols-2"><Input label="Tags" placeholder="bridal, everyday, gift (comma separated)" value={(product.tags || []).join(', ')} onChange={(event) => setField('tags', event.target.value.split(',').map((tag) => tag.trim()).filter(Boolean))} /><Input label="SEO URL slug" value={slugEdited ? product.slug : generatedSlug} onChange={(event) => { setSlugEdited(true); setField('slug', slugify(event.target.value)); }} help={`Store URL: /shop/${generatedSlug || 'product-name'}`} /></div>
            <Input label="SEO title" maxLength={60} placeholder={product.name || `Product name | ${storeName}`} value={product.seoTitle || ''} onChange={(event) => setField('seoTitle', event.target.value)} help={`${(product.seoTitle || '').length}/60 characters · concise titles display best in search.`} />
            <Textarea label="SEO description" rows={3} maxLength={160} placeholder="A clear summary for search results (up to 160 characters)." value={product.seoDescription || ''} onChange={(event) => setField('seoDescription', event.target.value)} help={`${(product.seoDescription || '').length}/160 characters`} />
          </Section>

          <Section id="review" number="7" title="Review and publish" description="Check the storefront preview and publish readiness before the product goes live.">
            <div className="overflow-hidden rounded-2xl border border-neutral-200 bg-white dark:border-white/10 dark:bg-[#101012]"><div className="flex gap-4 p-4"><div className="grid h-24 w-24 shrink-0 place-items-center overflow-hidden rounded-xl bg-neutral-100 text-neutral-400 dark:bg-white/10">{product.images[0] ? <img src={product.images[0].url || product.images[0].dataUrl} alt={product.images[0].altText || ''} className="h-full w-full object-cover" /> : <Gem className="h-7 w-7" />}</div><div className="min-w-0 py-1"><p className="truncate text-lg font-semibold text-neutral-950 dark:text-white">{product.name || 'Your product name'}</p><p className="mt-1 text-xs text-neutral-500">{product.categoryName || 'Category'} · {product.metalType}{product.purity ? ` · ${product.purity}` : ''}</p><p className="mt-3 line-clamp-3 text-xs leading-relaxed text-neutral-500">{product.description || 'Product description preview appears here.'}</p></div></div><div className="border-t border-neutral-100 bg-neutral-50/70 px-4 py-3 dark:border-white/10 dark:bg-white/[0.025]"><p className="truncate text-xs font-semibold text-blue-700">{product.seoTitle || product.name || 'Product title'} | {storeName}</p><p className="mt-1 truncate text-[11px] text-emerald-700">{window.location.host}/shop/{generatedSlug || 'product-name'}</p><p className="mt-1 line-clamp-2 text-xs text-neutral-500">{product.seoDescription || product.description || 'Search description preview.'}</p></div></div>
            <div className="rounded-2xl bg-neutral-50 p-4 dark:bg-white/[0.03]"><p className="text-xs font-semibold text-neutral-800 dark:text-neutral-200">Publish checklist</p><ul className="mt-3 grid gap-2 text-xs sm:grid-cols-2">{[[product.name.trim(), 'Product name'], [product.categoryName.trim(), 'Category'], [product.description.trim(), 'Description'], [product.images.length > 0, 'At least one photo'], [product.variants.length > 0 && product.variants.every((variant) => variant.sku.trim()), 'Variant SKUs'], [product.variants.length > 0 && product.variants.every((variant) => Number(variant.weightGrams) > 0), 'Variant weights'], [product.variants.every((variant, index) => variant.pricingMode === 'metal_weight' ? previews[index]?.available : Number(variant.fixedPrice) > 0), 'Variant pricing'], [!['gold', 'silver'].includes(product.metalType) || product.purity.trim(), 'Metal purity']].map(([ok, label]) => <li key={label} className={`flex items-center gap-2 ${ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-amber-700 dark:text-amber-300'}`}><span className={`grid h-4 w-4 place-items-center rounded-full ${ok ? 'bg-emerald-100 dark:bg-emerald-500/20' : 'bg-amber-100 dark:bg-amber-500/20'}`}>{ok ? <Check className="h-3 w-3" /> : <span className="h-1 w-1 rounded-full bg-current" />}</span>{label}</li>)}</ul></div>
          </Section>

          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-neutral-200/80 bg-white/95 p-3 shadow-lg shadow-black/5 backdrop-blur dark:border-white/10 dark:bg-[#141416]/95"><Link to="/admin/products" className="px-3 py-2 text-xs font-medium text-neutral-500 hover:text-neutral-950 dark:hover:text-white">Cancel</Link><div className="flex flex-wrap justify-end gap-2"><button type="button" disabled={saving} onClick={() => save('draft')} className="inline-flex h-10 items-center gap-2 rounded-full border border-neutral-200 px-4 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50 dark:border-white/10 dark:text-neutral-200 dark:hover:bg-white/5"><Save className="h-3.5 w-3.5" /> Save draft</button><button type="button" disabled={saving || !readyToPublish} onClick={() => save('published')} title={!readyToPublish ? 'Complete required details and resolve rate warnings before publishing.' : undefined} className="inline-flex h-10 items-center gap-2 rounded-full bg-neutral-950 px-5 text-xs font-semibold text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-neutral-950"><Eye className="h-3.5 w-3.5" />{saving ? 'Saving…' : product.status === 'published' ? 'Save & publish' : 'Publish product'}</button></div></div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4"><Card className="p-4"><p className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400">Form sections</p><nav className="mt-3 space-y-1">{steps.map(([id, label], index) => <a key={id} href={`#${id}`} className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs text-neutral-600 transition hover:bg-neutral-100 hover:text-neutral-950 dark:text-neutral-300 dark:hover:bg-white/5 dark:hover:text-white"><span className="grid h-5 w-5 place-items-center rounded-md bg-neutral-100 text-[10px] font-semibold text-neutral-500 dark:bg-white/10">{index + 1}</span>{label}</a>)}</nav></Card><Card className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white"><Search className="h-4 w-4 text-teal-700 dark:text-teal-300" /> SEO preview</div><p className="mt-3 line-clamp-2 text-sm font-medium text-blue-700">{product.seoTitle || product.name || 'Product title'}</p><p className="mt-1 text-[11px] text-emerald-700">/shop/{generatedSlug || 'product-name'}</p><p className="mt-1 line-clamp-3 text-xs leading-relaxed text-neutral-500">{product.seoDescription || product.description || 'Add a concise search description for this product.'}</p><p className="mt-3 text-[11px] leading-relaxed text-neutral-400">Photo alt text and a readable product slug help shoppers and search engines understand each item.</p></Card><Card className="p-4"><div className="flex items-center gap-2 text-sm font-semibold text-neutral-900 dark:text-white"><Gem className="h-4 w-4 text-teal-700 dark:text-teal-300" /> Pricing note</div><p className="mt-2 text-xs leading-relaxed text-neutral-500">Rate-based prices use the latest published per-gram metal rate, plus the variant’s making charge. The server checks the rate again when you publish.</p></Card></aside>
      </div>
    </div>
  );
}
