import { Link } from 'react-router';
import { ArrowUpRight, Clock3, MapPin, Phone } from 'lucide-react';
import Logo from '../features/catalog/layout/Logo.jsx';

const year = new Date().getFullYear();

const exploreLinks = [
  { label: 'Shop all jewellery', to: '/shop' },
  { label: 'Our story', to: '/about' },
  { label: 'Our craft', to: '/#our-craft' },
  { label: 'Today’s gold rate', to: '/gold-rate' },
  { label: 'Contact', to: '/contact' },
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden border-t border-[#c9a24f]/25 bg-[#17140f] text-stone-300">
      <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-36 h-80 w-80 rounded-full bg-[#c9a24f]/10 blur-[100px]" />
      <div className="relative mx-auto max-w-[1500px] px-5 pb-6 pt-14 sm:px-8 sm:pt-16 lg:px-12">
        <div className="grid gap-12 border-b border-white/10 pb-12 md:grid-cols-2 lg:grid-cols-[1.25fr_0.8fr_1fr_1.1fr] lg:gap-10">
          <div>
            <Logo light />
            <p className="mt-5 max-w-sm text-sm leading-7 text-stone-400">Jewellery shaped with care in Quetta, made to accompany the moments you keep.</p>
            <Link to="/shop" className="group mt-6 inline-flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-[#e3b968] transition-colors hover:text-white">Explore the collection <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
          </div>

          <nav aria-label="Explore">
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e3b968]">Explore</h2>
            <ul className="mt-5 space-y-3.5">{exploreLinks.map((item) => <li key={item.label}><Link to={item.to} className="text-sm text-stone-400 transition-colors hover:text-white">{item.label}</Link></li>)}</ul>
          </nav>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e3b968]">Visit us</h2>
            <p className="mt-5 flex items-start gap-3 text-sm leading-6 text-stone-400"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[#c9a24f]" /><span>Quetta, Pakistan</span></p>
            <p className="mt-3 flex items-start gap-3 text-sm leading-6 text-stone-400"><Clock3 className="mt-1 h-4 w-4 shrink-0 text-[#c9a24f]" /><span>Monday–Saturday<br />11:00 am–8:00 pm</span></p>
          </div>

          <div>
            <h2 className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#e3b968]">Talk with our team</h2>
            <p className="mt-5 max-w-xs text-sm leading-6 text-stone-400">For custom designs, current gold rates, or help choosing a piece, get in touch with us.</p>
            <a href="tel:+923128001212" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-white transition-colors hover:text-[#e3b968]"><Phone className="h-4 w-4 text-[#c9a24f]" />+92 312 800 1212</a>
            <Link to="/custom-order" className="mt-4 block w-fit border-b border-[#c9a24f]/50 pb-1 text-xs text-stone-300 transition-colors hover:border-[#e3b968] hover:text-[#e3b968]">Start a custom order</Link>
          </div>
        </div>
        <div className="mt-12 tracking-[20px]  flex flex-col items-center justify-center gap-3 text-[10px] text-stone-400 sm:flex-row">
          <h1 className=' md:text-[100px] text-6xl '>ZARREN JEWELERS</h1>
        </div>
        <div className="flex flex-col gap-3 pt-5 text-[11px] text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} Zareen Jewellers. Quetta, Pakistan.</p>
          <a href={`tel:+93782358092`} className="text-[15px] text-stone-500 hover:text-[#e3b968]">Developed by PoiaFlow</a>
        </div>
      </div>

    </footer>
  );
}
