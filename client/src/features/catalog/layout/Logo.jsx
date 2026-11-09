import { Link } from 'react-router';
import { useStoreBrand } from '../../../contexts/StoreBrandContext.jsx';

export default function Logo({ light = false }) {
  const { storeName } = useStoreBrand();
  const foreground = light ? 'text-[#f7efdc]' : 'text-[#29251f]';
  const emblem = light ? 'border-[#d5b56c]/80 text-[#e3b968]' : 'border-[#b99a60] text-[#9c7738]';
  return (
    <Link to="/" aria-label={`${storeName} home`} className={`group flex w-fit min-w-0 shrink-0 items-center gap-3 ${foreground}`}>
      <span className={`relative grid h-10 w-10 shrink-0 place-items-center rounded-full border font-serif text-xl transition-colors duration-300 group-hover:bg-[#d5b56c]/10 ${emblem}`}><span className="absolute inset-[3px] rounded-full border border-current opacity-30" />{storeName.trim().charAt(0).toLocaleUpperCase()}</span>
      <span className="max-w-[190px] truncate font-serif text-xs font-medium uppercase tracking-[0.13em] sm:max-w-[300px] sm:text-sm sm:tracking-[0.2em]">{storeName}</span>
    </Link>
  );
}
