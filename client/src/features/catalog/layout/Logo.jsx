import { Link } from 'react-router';

export default function Logo({ light = false }) {
  const foreground = light ? 'text-[#f7efdc]' : 'text-[#29251f]';
  const emblem = light ? 'border-[#d5b56c]/80 text-[#e3b968]' : 'border-[#b99a60] text-[#9c7738]';
  return (
    <Link to="/" aria-label="Zareen Jewellers home" className={`group flex w-fit shrink-0 items-center gap-3 ${foreground}`}>
      <span className={`relative grid h-10 w-10 place-items-center rounded-full border font-serif text-xl transition-colors duration-300 group-hover:bg-[#d5b56c]/10 ${emblem}`}><span className="absolute inset-[3px] rounded-full border border-current opacity-30" />Z</span>
      <span className="font-serif text-sm font-medium tracking-[0.24em] sm:text-base">ZAREEN<span className={`ml-1 text-[9px] tracking-[0.18em] ${light ? 'text-white/55' : 'text-stone-500'}`}>JEWELLERS</span></span>
    </Link>
  );
}
