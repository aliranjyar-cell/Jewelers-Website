import { Link } from 'react-router';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from './CartContext.jsx';

const number = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export default function CartItem({ item }) {
  const { setQuantity, removeItem } = useCart();
  return <article className="flex gap-4 border-b border-stone-200 py-5 last:border-0">
    <Link to={`/shop/${encodeURIComponent(item.productSlug || '')}`} className="h-24 w-24 shrink-0 overflow-hidden rounded-2xl bg-stone-100 sm:h-28 sm:w-28">{item.image && <img src={item.image} alt={item.productName} className="h-full w-full object-cover"/>}</Link>
    <div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-3"><div className="min-w-0"><Link to={`/shop/${encodeURIComponent(item.productSlug || '')}`} className="font-serif text-lg text-stone-900 hover:text-amber-800">{item.productName}</Link><p className="mt-1 text-xs text-stone-500">{[item.optionLabel, item.sku && `SKU ${item.sku}`, item.metalType, item.purity].filter(Boolean).join(' · ')}</p><p className="mt-2 text-xs text-stone-500">PKR {number.format(item.unitPrice)} each</p></div><button type="button" onClick={() => removeItem(item.variantId)} aria-label={`Remove ${item.productName}`} className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-stone-400 transition hover:bg-red-50 hover:text-red-700"><Trash2 className="h-4 w-4"/></button></div>
      <div className="mt-4 flex items-center justify-between gap-3"><div className="flex h-9 items-center rounded-full border border-stone-300"><button type="button" onClick={() => setQuantity(item.variantId, item.quantity - 1)} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center text-stone-600"><Minus className="h-3.5 w-3.5"/></button><span className="w-7 text-center text-xs font-medium tabular-nums">{item.quantity}</span><button type="button" onClick={() => setQuantity(item.variantId, item.quantity + 1)} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center text-stone-600"><Plus className="h-3.5 w-3.5"/></button></div><p className="text-sm font-semibold text-stone-900">PKR {number.format(item.unitPrice * item.quantity)}</p></div>
    </div>
  </article>;
}
