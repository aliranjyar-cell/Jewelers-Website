import { Link } from 'react-router';
import { ArrowRight, ShoppingBag } from 'lucide-react';
import CartItem from './CartItem.jsx';
import { useCart } from './CartContext.jsx';

const number = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 });

export default function CartPage() {
  const { items, itemCount } = useCart();
  const subtotal = items.reduce((sum, item) => sum + Number(item.unitPrice || 0) * item.quantity, 0);
  return <main className="min-h-[65vh] bg-[#fbfaf8] px-5 pb-16 pt-8 text-stone-900 sm:px-8"><div className="mx-auto max-w-6xl">
    <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-800">Your selection</p><h1 className="mt-2 font-serif text-4xl font-light sm:text-5xl">Shopping bag</h1><p className="mt-3 text-sm text-stone-500">{itemCount} {itemCount === 1 ? 'piece' : 'pieces'} selected</p>
    {!items.length ? <div className="mt-10 rounded-[2rem] border border-stone-200 bg-white px-6 py-16 text-center"><ShoppingBag className="mx-auto h-8 w-8 text-stone-300"/><h2 className="mt-4 font-serif text-2xl">Your bag is waiting</h2><p className="mt-2 text-sm text-stone-500">Explore the collection and add a piece you love.</p><Link to="/shop" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-stone-900 px-6 text-xs font-medium uppercase tracking-[0.12em] text-white hover:bg-stone-700">Explore the collection<ArrowRight className="h-4 w-4"/></Link></div> : <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <section className="rounded-[2rem] border border-stone-200 bg-white px-5 sm:px-7"><div className="divide-y divide-stone-200">{items.map((item) => <CartItem key={item.variantId} item={item}/>)}</div><Link to="/shop" className="inline-flex items-center gap-2 py-5 text-xs font-medium uppercase tracking-[0.12em] text-amber-900 hover:text-stone-900">Continue shopping<ArrowRight className="h-3.5 w-3.5"/></Link></section>
      <aside className="h-fit rounded-[2rem] border border-stone-200 bg-white p-6"><h2 className="font-serif text-2xl">Order estimate</h2><div className="mt-5 flex justify-between text-sm text-stone-600"><span>Item subtotal</span><span>PKR {number.format(subtotal)}</span></div><div className="mt-3 flex justify-between text-sm text-stone-500"><span>Delivery fee</span><span>Confirmed after review</span></div><p className="mt-4 border-t border-stone-200 pt-4 text-xs leading-6 text-stone-500">We’ll confirm the delivery charge and payment options with you before the final total is agreed. No payment is collected at checkout.</p><Link to="/checkout" className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-900 px-5 text-sm font-medium text-white transition hover:bg-stone-700">Continue to delivery details<ArrowRight className="h-4 w-4"/></Link></aside>
    </div>}
  </div></main>;
}
