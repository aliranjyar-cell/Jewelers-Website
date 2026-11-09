import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getPublicCampaign } from '../../../../lib/api.js';

export default function Hero() {
  const [campaign, setCampaign] = useState(null);
  useEffect(() => { let active = true; getPublicCampaign('hero').then((value) => { if (active) setCampaign(value); }); return () => { active = false; }; }, []);
  const title = campaign?.title || 'Jewellery chosen\nwith intention';
  const lines = title.split('\n');
  const destination = campaign?.ctaUrl || '/shop';
  return <section aria-label="Featured collection" className="relative isolate flex min-h-[650px] items-center overflow-hidden bg-[#17140f] pt-24 text-white sm:min-h-[720px]">
    {campaign?.imageUrl ? <picture className="absolute inset-0 -z-20"><source media="(max-width: 640px)" srcSet={campaign.mobileImageUrl || campaign.imageUrl}/><img src={campaign.imageUrl} alt={campaign.imageAlt || ''} fetchPriority="high" className="h-full w-full object-cover" /></picture> : <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[radial-gradient(ellipse_at_75%_45%,rgba(174,132,55,.3),transparent_42%),linear-gradient(115deg,#17140f_15%,#30271b_58%,#17140f)]"/>}
    <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/75 via-black/45 to-black/15"/><div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/40 via-transparent to-black/20"/>
    <div className="mx-auto w-full max-w-[1500px] px-6 pb-20 pt-16 sm:px-10 lg:px-16">
      <div className="max-w-2xl">
        <p className="text-[10px] font-medium uppercase tracking-[0.36em] text-[#e3b968] sm:text-xs">{campaign?.eyebrow || 'A considered collection'}</p>
        <span aria-hidden="true" className="my-6 block h-px w-14 bg-[#c9a24f]"/>
        <h1 className="font-serif text-5xl font-medium leading-[1.04] tracking-tight text-[#f8f2e6] sm:text-6xl lg:text-7xl">{lines.map((line, index)=><span key={`${line}-${index}`} className="block">{line}</span>)}</h1>
        <p className="mt-6 max-w-lg text-sm leading-7 text-white/75 sm:text-base">{campaign?.body || 'Explore carefully selected pieces, transparent pricing, and designs made for the moments that matter.'}</p>
        <div className="mt-9 flex flex-wrap gap-3">
          <Link to={destination} className="inline-flex min-h-12 items-center justify-center bg-[#c9a24f] px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-neutral-950 transition hover:bg-[#e0bd70]">{campaign?.ctaLabel || 'Explore the collection'}</Link>
          <Link to="/custom-order" className="inline-flex min-h-12 items-center justify-center border border-white/50 px-7 text-[11px] font-semibold uppercase tracking-[0.18em] text-white transition hover:border-[#e3b968] hover:text-[#f0d69c]">Request a custom design</Link>
        </div>
        {campaign?.imageUrl && <p className="mt-5 text-[10px] text-white/55">{campaign.imageAlt}</p>}
      </div>
    </div>
    <div aria-hidden="true" className="pointer-events-none absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a24f]/60 to-transparent"/>
  </section>;
}
