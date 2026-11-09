import { Link } from 'react-router';
import { ArrowRight, Sparkles } from 'lucide-react';

const PHOTO = '/images/jewelry-display.jpg';
const BRICKS = Array.from({ length: 7 }, (_, column) => {
  const top = [-120, -40, -130, -50, -120, -40, -130][column];
  return Array.from({ length: 3 }, (_, row) => ({ x: 30 + column * 130, y: top + row * 275 }));
}).flat();

function BrickShapes({ outlined = false }) {
  return (
    <g
      fill={outlined ? 'none' : 'white'}
      stroke={outlined ? 'url(#goldGradient)' : 'none'}
      strokeWidth={outlined ? 2.5 : undefined}
      transform="rotate(-18.5 500 330)"
    >
      {BRICKS.map((brick, index) => <rect key={index} x={brick.x} y={brick.y} width="105" height="250" rx="20" ry="20" />)}
    </g>
  );
}

function MosaicArtwork() {
  return (
    <div className="golden-card-glow group relative w-full" id="architectural-mosaic">
      <svg viewBox="0 0 1000 660" className="h-auto w-full select-none overflow-visible drop-shadow-2xl" role="img" aria-labelledby="mosaic-title mosaic-description">
        <title id="mosaic-title">Jewelry revealed through sculpted facets</title>
        <desc id="mosaic-description">One photograph of jewelry, visible only through a grid of separated, rounded, angled shapes.</desc>
        <defs>
          <mask id="jewelry-brick-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="1000" height="660" mask-type="luminance">
            <rect width="1000" height="660" fill="black" />
            <BrickShapes />
          </mask>
          <linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FCD34D" stopOpacity="0.9" />
            <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#B45309" stopOpacity="0.95" />
          </linearGradient>
          <filter id="goldGlowFilter" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="6" stdDeviation="12" floodColor="#F59E0B" floodOpacity="0.55" />
            <feDropShadow dx="0" dy="1" stdDeviation="4" floodColor="#FDE68A" floodOpacity="0.3" />
          </filter>
        </defs>

        <g mask="url(#jewelry-brick-mask)" className="origin-center transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          <image href={PHOTO} x="0" y="0" width="1000" height="660" preserveAspectRatio="xMidYMid slice" />
          <rect width="1000" height="660" fill="url(#goldGradient)" opacity="0.12" style={{ mixBlendMode: 'overlay' }} />
        </g>

        <g filter="url(#goldGlowFilter)" className="origin-center opacity-85 transition-transform duration-700 ease-out group-hover:scale-[1.02]">
          <BrickShapes outlined />
        </g>
      </svg>
    </div>
  );
}

export default function ArchitecturalSplitSection() {
  return (
    <section className="relative overflow-hidden bg-[#0b0c10] px-5 py-14 text-[#f3f4f6] antialiased selection:bg-amber-500/30 selection:text-amber-200 sm:px-8 sm:py-20 lg:px-12 lg:py-24">
      <div className="relative mx-auto w-full max-w-[1500px] overflow-hidden rounded-3xl border border-amber-500/15 bg-[#111318]/95 p-6 shadow-2xl backdrop-blur-xl sm:p-9 md:p-12 lg:p-16">
        <div aria-hidden="true" className="pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full bg-amber-600/10 blur-[100px]" />
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-32 -right-32 h-[30rem] w-[30rem] rounded-full bg-amber-500/15 blur-[120px]" />

        <div className="relative grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12 xl:gap-14">
          <div className="z-10 flex flex-col justify-center space-y-6 lg:col-span-5">
            <div className="inline-flex w-fit items-center gap-2.5 rounded border border-amber-500/30 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
              
              A study in form
            </div>

            <h2 className="font-serif text-4xl leading-[1.15] tracking-tight text-white md:text-5xl lg:text-6xl">
              One image,<br />
              <span className="bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text font-normal italic text-transparent">many facets.</span>
            </h2>

            <p className="pr-2 text-base font-light leading-relaxed text-neutral-400 md:text-lg">
              A single photograph reveals the details from a different angle through every opening. Together, the pieces form one continuous portrait of jewellery made with care.
            </p>

            <div className="grid grid-cols-2 gap-6 border-t border-neutral-800/80 pt-5">
              
              
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-1 sm:gap-4">
              <Link to="/shop" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3.5 text-sm font-semibold text-neutral-950 shadow-lg shadow-amber-500/25 transition duration-300 hover:-translate-y-0.5 hover:from-amber-400 hover:to-amber-500 hover:shadow-amber-500/40 active:translate-y-0 sm:px-7">
                Explore collection <ArrowRight className="h-4 w-4" />
              </Link>
              
            </div>
          </div>

          <div className="relative flex w-full items-center justify-center lg:col-span-7">
            <MosaicArtwork />
          </div>
        </div>
      </div>

      <style>{`
        .golden-card-glow { filter: drop-shadow(0 12px 28px rgba(212, 175, 55, .45)) drop-shadow(0 2px 8px rgba(245, 158, 11, .3)); transition: filter .6s cubic-bezier(.22,1,.36,1), transform .6s cubic-bezier(.22,1,.36,1); }
        .golden-card-glow:hover { filter: drop-shadow(0 16px 36px rgba(212, 175, 55, .65)) drop-shadow(0 4px 14px rgba(245, 158, 11, .45)); }
        @media (prefers-reduced-motion: reduce) { .golden-card-glow, .golden-card-glow * { transition-duration: .01ms !important; animation-duration: .01ms !important; } }
      `}</style>
    </section>
  );
}
