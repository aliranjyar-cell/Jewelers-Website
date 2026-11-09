import { useState } from 'react';
import { Link } from 'react-router';
import { ArrowUpRight, Gem, Heart } from 'lucide-react';

const money = (value) => Number(value) > 0
  ? `Rs. ${new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Number(value))}`
  : 'Price on request';

export default function ProductCard({ product = {}, wished = false, onToggleWish, className = '' }) {
  const [imageFailed, setImageFailed] = useState(false);
  const id = product.id || product.slug || product.name;
  const href = product.href || `/shop/${encodeURIComponent(product.slug || id || '')}`;
  const price = product.price ?? product.minPrice ?? product.fixedPrice;

  return (
    <article className={`group relative z-0 rounded-tl-[2rem] rounded-br-[2rem] bg-transparent px-7 pb-6 pt-7 transition duration-300 ease-out hover:z-30 hover:-translate-y-2 hover:bg-white hover:shadow-[0_22px_45px_-18px_rgba(90,64,20,0.28)] focus-within:z-30 focus-within:-translate-y-2 focus-within:bg-white focus-within:shadow-[0_22px_45px_-18px_rgba(90,64,20,0.28)] ${className}`}>
      <div className="relative aspect-[4/5] overflow-hidden rounded-tl-[1.5rem] rounded-br-[1.5rem] bg-gradient-to-br from-[#e8ddc8] via-[#f4eee3] to-[#d7c49e]">
        {!imageFailed && product.image && <img src={product.image} alt={product.name || 'Jewellery piece'} loading="lazy" onError={() => setImageFailed(true)} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />}
        {(imageFailed || !product.image) && <div className="absolute inset-0 grid place-items-center text-[#a78c5c]"><Gem className="h-12 w-12" strokeWidth={1} /></div>}
        <button type="button" onClick={() => onToggleWish?.(id)} aria-pressed={wished} aria-label={wished ? `Remove ${product.name} from wishlist` : `Add ${product.name} to wishlist`} className={`absolute right-3 top-3 grid h-10 w-10 place-items-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 ${wished ? 'text-rose-700' : 'text-stone-700 hover:text-rose-700'}`}>
          <Heart className="h-[18px] w-[18px]" fill={wished ? 'currentColor' : 'none'} />
        </button>
        {product.badge && <span className="absolute left-3 top-3 rounded-full bg-[#29251f]/85 px-3 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white">{product.badge}</span>}
      </div>
      <div className="pt-5">
        <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-amber-800">{product.category || 'Fine jewellery'}</p>
        <h3 className="mt-1.5 line-clamp-1 font-serif text-lg text-neutral-900"><Link to={href} className="focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-700">{product.name || 'Jewellery piece'}</Link></h3>
        {(product.karat || product.weight) && <p className="mt-1 text-xs text-neutral-500">{[product.karat, product.weight].filter(Boolean).join(' · ')}</p>}
        <div className="mt-3 flex min-h-6 items-baseline gap-2.5">
          <span className="text-xl font-semibold leading-none text-neutral-900">{money(price)}</span>
          {Number(product.oldPrice) > Number(price) && <span className="text-xs text-neutral-400 line-through">{money(product.oldPrice)}</span>}
        </div>
        <div className="mt-4 h-6 overflow-hidden">
          <Link to={href} className="inline-flex translate-y-3 items-center gap-1.5 border-b border-amber-700/50 pb-0.5 text-[11px] font-medium uppercase tracking-[0.16em] text-neutral-900 opacity-0 transition-all duration-300 hover:text-amber-800 focus-visible:translate-y-0 focus-visible:opacity-100 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 [@media(hover:none)]:translate-y-0 [@media(hover:none)]:opacity-100">View piece <ArrowUpRight className="h-3.5 w-3.5" /></Link>
        </div>
      </div>
    </article>
  );
}
