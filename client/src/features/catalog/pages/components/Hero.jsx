import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getPublicCampaign } from '../../../../lib/api.js';

export default function Hero() {
  const [campaign, setCampaign] = useState(null);
  useEffect(() => { let active = true; getPublicCampaign('hero').then((value) => { if (active) setCampaign(value); }); return () => { active = false; }; }, []);
  const title = campaign?.title || 'Jewellery chosen\nwith intention';
  const lines = title.split('\n');
  const destination = campaign?.ctaUrl || '/shop';
  const alignment = ['left', 'center', 'right'].includes(campaign?.heroAlignment) ? campaign.heroAlignment : 'left';
  const copyPosition = alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : 'mr-auto';
  const paragraphPosition = alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : 'mr-auto';
  const textColor = campaign?.heroTextColor || '#F8F2E6';
  const overlay = alignment === 'right' ? 'bg-gradient-to-l from-black/75 via-black/45 to-black/15' : alignment === 'center' ? 'bg-black/45' : 'bg-gradient-to-r from-black/75 via-black/45 to-black/15';
  return <section aria-label="Featured collection" className="relative isolate flex min-h-[650px] items-center overflow-hidden bg-[#17140f] pt-24 text-white sm:min-h-[720px]">
    <style>{`@keyframes hero-image-drift{from{transform:scale(1.04)}to{transform:scale(1.12)}}@keyframes hero-copy-enter{from{opacity:0;transform:translate3d(0,18px,0)}to{opacity:1;transform:translate3d(0,0,0)}}@keyframes hero-light-drift{0%,100%{transform:translate3d(0,0,0);opacity:.28}50%{transform:translate3d(-24px,18px,0);opacity:.42}}.hero-image-drift{animation:hero-image-drift 24s ease-in-out infinite alternate}.hero-copy-enter{animation:hero-copy-enter 900ms cubic-bezier(.2,.7,.2,1) both}.hero-light-drift{animation:hero-light-drift 13s ease-in-out infinite}@media(prefers-reduced-motion:reduce){.hero-image-drift,.hero-copy-enter,.hero-light-drift{animation:none!important}}`}</style>
    {campaign?.imageUrl ? <picture className="absolute inset-0 -z-20 overflow-hidden"><source media="(max-width: 640px)" srcSet={campaign.mobileImageUrl || campaign.imageUrl} /><img src={campaign.imageUrl} alt={campaign.imageAlt || ''} fetchPriority="high" className="hero-image-drift h-full w-full object-cover" /></picture> : <div aria-hidden="true" className="hero-image-drift absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_45%,rgba(174,132,55,.3),transparent_42%),linear-gradient(115deg,#17140f_15%,#30271b_58%,#17140f)]" />}
    <div className={`absolute inset-0 -z-10 ${overlay}`} /><div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-transparent to-black/20" /><div aria-hidden="true" className="hero-light-drift pointer-events-none absolute -right-32 top-10 -z-10 h-80 w-80 rounded-full bg-[#d5ae58]/20 blur-[100px]" />
    <div className="mx-auto w-full max-w-[1500px] px-6 pb-20 pt-16 sm:px-10 lg:px-16">
      <div className={`hero-copy-enter max-w-2xl ${copyPosition}`} style={{ textAlign: alignment, color: textColor }}>
        <p className="text-[10px] font-medium uppercase tracking-[0.36em] sm:text-xs">{campaign?.eyebrow || 'A considered collection'}</p>
        <span aria-hidden="true" className={`my-6 block h-px w-14 bg-[#c9a24f] ${alignment === 'center' ? 'mx-auto' : alignment === 'right' ? 'ml-auto' : ''}`} />
        <h1 className="font-serif text-5xl font-medium leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl">{lines.map((line, index) => <span key={`${line}-${index}`} className="block">{line}</span>)}</h1>
        <p className={`mt-6 max-w-lg text-sm leading-7 opacity-85 sm:text-base ${paragraphPosition}`}>{campaign?.body || 'Explore carefully selected pieces, transparent pricing, and designs made for the moments that matter.'}</p>
        <div className={`mt-9 flex flex-wrap gap-3 ${alignment === 'center' ? 'justify-center' : alignment === 'right' ? 'justify-end' : 'justify-start'}`}>
          <Link to={destination} className="inline-flex min-h-12 items-center justify-center bg-[#c9a24f] px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-950 transition hover:bg-[#e0bd70]">{campaign?.ctaLabel || 'Explore the collection'}</Link>
          <Link to="/custom-order" style={{ color: textColor, borderColor: `${textColor}99` }} className="inline-flex min-h-12 items-center justify-center border px-7 text-[11px] font-semibold uppercase tracking-[0.18em] transition hover:border-[#e3b968] hover:text-[#f0d69c]">Request a custom design</Link>
        </div>
        {campaign?.imageUrl && <p className="mt-5 text-[10px] opacity-65">{campaign.imageAlt}</p>}
      </div>
    </div>
    <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a24f]/60 to-transparent" />
  </section>;
}
