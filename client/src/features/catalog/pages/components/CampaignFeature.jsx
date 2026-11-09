import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { getPublicCampaign } from '../../../../lib/api.js';

export default function CampaignFeature() {
  const [campaign, setCampaign] = useState(null);
  useEffect(() => { let active = true; getPublicCampaign('home_feature').then((value) => { if (active) setCampaign(value); }); return () => { active = false; }; }, []);
  if (!campaign) return null;
  return <section className="mx-auto max-w-[1500px] px-5 py-12 sm:px-8 lg:px-12" aria-label="Featured campaign">
    <div className="grid overflow-hidden bg-[#211c14] text-white md:min-h-[340px] md:grid-cols-2">
      <div className="flex flex-col items-start justify-center p-8 sm:p-12 lg:p-16"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#e3b968]">{campaign.eyebrow || 'Featured'}</p><h2 className="mt-4 font-serif text-3xl leading-tight sm:text-4xl">{campaign.title}</h2>{campaign.body && <p className="mt-4 max-w-lg text-sm leading-7 text-white/70">{campaign.body}</p>}{campaign.ctaLabel && <Link to={campaign.ctaUrl || '/shop'} className="mt-7 inline-flex min-h-11 items-center bg-[#c9a24f] px-6 text-[10px] font-semibold uppercase tracking-[0.18em] text-neutral-950 hover:bg-[#e0bd70]">{campaign.ctaLabel}</Link>}</div>
      {campaign.imageUrl && <picture className="min-h-[230px] md:min-h-full"><source media="(max-width: 767px)" srcSet={campaign.mobileImageUrl || campaign.imageUrl}/><img src={campaign.imageUrl} alt={campaign.imageAlt || ''} loading="lazy" className="h-full min-h-[230px] w-full object-cover"/></picture>}
    </div>
  </section>;
}
