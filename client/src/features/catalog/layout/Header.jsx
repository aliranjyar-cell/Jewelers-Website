import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { Menu, Phone, Search, X } from 'lucide-react';
import Logo from './Logo.jsx';

const links = [
  { label: 'Shop', to: '/shop' },
  { label: 'Bridal', to: '/shop' },
  { label: 'Gold', to: '/shop' },
  { label: 'Our craft', to: '/#our-craft' },
  { label: 'Our story', to: '/about' },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === '/';
  const solid = !isHome || scrolled;

  useEffect(() => {
    const updateScrollState = () => setScrolled(window.scrollY > 24);
    updateScrollState();
    window.addEventListener('scroll', updateScrollState, { passive: true });
    return () => window.removeEventListener('scroll', updateScrollState);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKeyDown = (event) => { if (event.key === 'Escape') setMenuOpen(false); };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen]);

  function submitSearch(event) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    navigate(`/shop${params.size ? `?${params}` : ''}`);
    setSearchOpen(false);
    setMenuOpen(false);
  }

  const iconButton = `grid h-10 w-10 place-items-center rounded-full transition-colors ${solid ? 'text-stone-800 hover:bg-black/5' : 'text-white hover:bg-white/10'}`;

  return (
    <>
      <div className={`absolute inset-x-0 top-0 z-[60] h-9 transition-all duration-300 ${isHome ? 'bg-neutral-950/25 text-white backdrop-blur-[2px]' : 'bg-[#252019] text-white'} ${isHome && scrolled ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100'}`}>
        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-5 text-[10px] sm:px-8 sm:text-[11px]">
          <p><span className="font-medium text-[#e3b968]">Made in Quetta</span><span className="mx-2 text-white/40">·</span>Crafted to be kept</p>
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/gold-rate" className="hidden text-[#f0d69c] transition-colors hover:text-white sm:inline">Ask for today’s gold rate</Link>
            <a href="tel:+923128001212" className="inline-flex items-center gap-1.5 transition-colors hover:text-[#f0d69c]"><Phone className="h-3 w-3" /><span>+92 312 800 1212</span></a>
          </div>
        </div>
      </div>

      <header className={`fixed inset-x-0 z-50 transition-[top,background-color,box-shadow,border-color] duration-300 ${scrolled ? 'top-0' : 'top-9'} ${solid ? (isHome ? 'border-b border-white/10 bg-[#18140f]/88 text-white shadow-lg shadow-black/10 backdrop-blur-xl' : 'border-b border-[#d9cbb2]/70 bg-[#fbfaf8]/95 text-stone-900 shadow-[0_10px_30px_rgba(46,35,18,0.06)] backdrop-blur-xl') : 'border-b border-transparent bg-transparent text-white'}`}>
        <div className="mx-auto flex h-[76px] max-w-[1500px] items-center justify-between gap-4 px-5 sm:px-8 lg:px-12">
          <div className="min-w-0 flex-1"><Logo light={isHome} /></div>

          <nav className="hidden items-center justify-center gap-1 xl:flex" aria-label="Main navigation">
            {links.map((item) => <Link key={item.label} to={item.to} className={`group relative px-3 py-3 text-[10px] font-medium uppercase tracking-[0.19em] transition-colors 2xl:px-4 ${solid && isHome ? 'text-white/75 hover:text-[#f0d69c]' : solid ? 'text-stone-600 hover:text-[#96753d]' : 'text-white/85 hover:text-[#f0d69c]'}`}>
              {item.label}
              <span className="absolute inset-x-4 bottom-1 h-px origin-center scale-x-0 bg-[#d5b56c] transition-transform duration-300 group-hover:scale-x-100" />
            </Link>)}
          </nav>

          <div className="flex flex-1 items-center justify-end gap-1 sm:gap-2">
            <Link to="/custom-order" className={`hidden border px-4 py-2.5 text-[9px] font-medium uppercase tracking-[0.16em] transition-colors 2xl:inline-flex ${solid && isHome ? 'border-[#d5b56c]/60 text-[#f0d69c] hover:bg-[#d5b56c] hover:text-neutral-950' : solid ? 'border-[#a8874d]/60 text-[#71562d] hover:bg-[#a8874d] hover:text-white' : 'border-white/55 text-white hover:border-[#d5b56c] hover:bg-[#d5b56c] hover:text-neutral-950'}`}>Made for you</Link>
            <button type="button" onClick={() => { setSearchOpen((open) => !open); setMenuOpen(false); }} aria-label={searchOpen ? 'Close search' : 'Search products'} aria-expanded={searchOpen} className={iconButton}>{searchOpen ? <X className="h-[18px] w-[18px]" /> : <Search className="h-[18px] w-[18px]" />}</button>
            <button type="button" onClick={() => { setMenuOpen((open) => !open); setSearchOpen(false); }} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} className={`${iconButton} xl:hidden`}>{menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}</button>
          </div>
        </div>

        {searchOpen && <form role="search" onSubmit={submitSearch} className="border-t border-stone-200/70 bg-[#fbfaf8] px-5 py-4 text-stone-900 shadow-lg sm:px-8"><div className="mx-auto flex max-w-3xl gap-3"><input autoFocus type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search rings, necklaces, bangles…" aria-label="Search products" className="min-w-0 flex-1 rounded-full border border-stone-300 bg-white px-5 py-3 text-sm outline-none focus:border-amber-700" /><button className="rounded-full bg-neutral-900 px-6 text-xs font-medium uppercase tracking-wider text-white transition hover:bg-amber-900">Search</button></div></form>}
        {menuOpen && <nav className="absolute inset-x-0 top-full border-t border-stone-200 bg-[#fbfaf8] px-5 py-3 text-stone-900 shadow-xl xl:hidden" aria-label="Mobile navigation">{links.map((item) => <Link key={item.label} to={item.to} onClick={() => setMenuOpen(false)} className="block border-b border-stone-200/70 py-4 text-xs font-medium uppercase tracking-[0.18em] last:border-0">{item.label}</Link>)}<Link to="/custom-order" onClick={() => setMenuOpen(false)} className="mt-3 block rounded-full bg-stone-900 px-5 py-3 text-center text-xs font-medium uppercase tracking-[0.16em] text-white">Request a custom piece</Link></nav>}
      </header>
    </>
  );
}
