import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/* ----------------------------- content ----------------------------- */
const COLLECTIONS = [
  { name: "Bridal Sets", count: "Made for celebrations", href: "/shop", image: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80" },
  { name: "Everyday Gold", count: "Made for every day", href: "/shop", image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=80" },
  { name: "Bars & Coins", count: "Explore the collection", href: "/shop", image: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=700&q=80" },
  { name: "Custom Orders", count: "Made for you", href: "/custom-order", image: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80" },
];

const STATS = [
  { value: 35, suffix: "+", label: "Years of trust" },
  { value: 12000, suffix: "+", label: "Families served" },
  { value: 100, suffix: "%", label: "Hallmarked gold" },
];

const SPARKLES = [
  { l: "7%", t: "16%", s: 3, d: 0 },
  { l: "18%", t: "72%", s: 2, d: 1.4 },
  { l: "31%", t: "9%", s: 2, d: 2.6 },
  { l: "44%", t: "88%", s: 3, d: 0.8 },
  { l: "53%", t: "22%", s: 2, d: 3.2 },
  { l: "66%", t: "64%", s: 3, d: 1.9 },
  { l: "78%", t: "12%", s: 2, d: 0.4 },
  { l: "87%", t: "78%", s: 3, d: 2.2 },
  { l: "94%", t: "38%", s: 2, d: 3.6 },
  { l: "12%", t: "44%", s: 2, d: 2.9 },
];

/* ------------------------------ hooks ------------------------------ */
function useInView(threshold = 0.2) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect(); // play once
        }
      },
      { threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return { ref, inView };
}

function useCountUp(target, start, duration = 1800) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!start) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setValue(target);
      return;
    }
    let raf;
    let t0;
    const step = (t) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [start, target, duration]);

  return value;
}

function Stat({ value, suffix, label, start }) {
  const n = useCountUp(value, start);
  return (
    <div>
      <p className="font-serif text-3xl text-[#e3b968] sm:text-4xl">
        {n.toLocaleString("en-US")}
        {suffix}
      </p>
      <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-neutral-400">{label}</p>
    </div>
  );
}

/* --------------------------- background --------------------------- */
function Backdrop() {
  return (
    <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden="true">
      {/* drifting golden light */}
      <div className="cs-glow cs-glow-a absolute -left-32 top-10 h-[34rem] w-[34rem] rounded-full bg-[radial-gradient(circle,rgba(201,162,79,0.20),transparent_65%)] blur-2xl" />
      <div className="cs-glow cs-glow-b absolute -right-24 bottom-0 h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,rgba(176,120,48,0.18),transparent_65%)] blur-2xl" />

      {/* fine diamond lattice that fades toward the edges */}
      <div
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(135deg, rgba(201,162,79,0.07) 1px, transparent 1px), linear-gradient(45deg, rgba(201,162,79,0.07) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
          WebkitMaskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
          maskImage: "radial-gradient(ellipse at center, black 25%, transparent 75%)",
        }}
      />

      {/* tiny twinkling specks */}
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className="cs-twinkle absolute rounded-full bg-[#f2d58f]"
          style={{ left: s.l, top: s.t, width: s.s, height: s.s, animationDelay: `${s.d}s` }}
        />
      ))}

      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c9a24f]/50 to-transparent" />
    </div>
  );
}

/* ------------------------------ section ------------------------------ */
export default function CraftSection() {
  const { ref, inView } = useInView(0.2);
  const frameRef = useRef(null);

  // soft mouse parallax on the big image (no re-render, just CSS variables)
  const onMove = (e) => {
    const el = frameRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--px", ((e.clientX - r.left) / r.width - 0.5).toFixed(3));
    el.style.setProperty("--py", ((e.clientY - r.top) / r.height - 0.5).toFixed(3));
  };
  const onLeave = () => {
    frameRef.current?.style.setProperty("--px", 0);
    frameRef.current?.style.setProperty("--py", 0);
  };

  return (
    <section
      id="our-craft"
      ref={ref}
      data-in={inView}
      className="relative isolate overflow-hidden bg-[#120e09] py-24 text-[#f3ead6] sm:py-28"
    >
      <style>{`
        @keyframes cs-rise  { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: none; } }
        @keyframes cs-image { from { opacity: 0; transform: translateY(30px) scale(1.06); } to { opacity: 1; transform: none; } }
        @keyframes cs-card  { from { opacity: 0; transform: translateY(110px); } to { opacity: 1; transform: none; } }
        @keyframes cs-draw  { to { stroke-dashoffset: 0; } }
        @keyframes cs-shine { from { transform: translateX(-130%); } to { transform: translateX(130%); } }
        @keyframes cs-drift-a { from { transform: translate(0,0); } to { transform: translate(90px, 50px); } }
        @keyframes cs-drift-b { from { transform: translate(0,0); } to { transform: translate(-70px, -60px); } }
        @keyframes cs-twinkle { 0%,100% { opacity: .08; transform: scale(.6); } 50% { opacity: .9; transform: scale(1.1); } }
        @keyframes cs-bob { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }

        .cs-rv, .cs-card, .cs-img { opacity: 0; }
        [data-in="true"] .cs-rv   { animation: cs-rise 1000ms cubic-bezier(.2,.7,.2,1) forwards; animation-delay: var(--d, 0ms); }
        [data-in="true"] .cs-img  { animation: cs-image 1400ms cubic-bezier(.2,.7,.2,1) forwards; }
        [data-in="true"] .cs-card { animation: cs-card 1100ms cubic-bezier(.2,.8,.2,1) forwards; animation-delay: var(--d, 0ms); }

        .cs-draw { stroke-dasharray: 1; stroke-dashoffset: 1; }
        [data-in="true"] .cs-draw { animation: cs-draw 2400ms ease-out 300ms forwards; }

        .cs-shine { transform: translateX(-130%); }
        [data-in="true"] .cs-shine { animation: cs-shine 1700ms ease-in-out 1300ms 1 forwards; }

        .cs-glow-a { animation: cs-drift-a 26s ease-in-out infinite alternate; }
        .cs-glow-b { animation: cs-drift-b 32s ease-in-out infinite alternate; }
        .cs-twinkle { animation: cs-twinkle 5s ease-in-out infinite; }
        .cs-badge { animation: cs-bob 6s ease-in-out infinite; }

        .cs-frame-img {
          transform: translate3d(calc(var(--px, 0) * -16px), calc(var(--py, 0) * -16px), 0) scale(1.1);
          transition: transform 400ms ease-out;
        }
        .cs-scroll { scrollbar-width: none; }
        .cs-scroll::-webkit-scrollbar { display: none; }

        @media (prefers-reduced-motion: reduce) {
          .cs-rv, .cs-card, .cs-img { opacity: 1; animation: none !important; }
          .cs-draw { stroke-dashoffset: 0; animation: none !important; }
          .cs-shine, .cs-glow, .cs-twinkle, .cs-badge { animation: none !important; }
          .cs-frame-img { transition: none; }
        }
      `}</style>

      <Backdrop />

      {/* clip shape for the big image: an arch with one cut corner */}
      <svg width="0" height="0" className="absolute" aria-hidden="true" focusable="false">
        <defs>
          <clipPath id="craft-arch" clipPathUnits="objectBoundingBox">
            <path d="M0 1 V0.4 C0 0.178 0.2225 0 0.5 0 C0.7775 0 1 0.178 1 0.4 V0.88 L0.85 1 Z" />
          </clipPath>
        </defs>
      </svg>

      <div className="mx-auto grid max-w-7xl items-center gap-16 px-4 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8">
        {/* ---------------- Big image ---------------- */}
        <div className="mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
          <div
            ref={frameRef}
            onPointerMove={onMove}
            onPointerLeave={onLeave}
            className="relative aspect-[4/5] w-full"
          >
            {/* offset outline that draws itself */}
            <svg
              viewBox="0 0 400 500"
              className="absolute inset-0 h-full w-full translate-x-4 translate-y-4 overflow-visible"
              fill="none"
              aria-hidden="true"
            >
              <path
                className="cs-draw"
                pathLength="1"
                d="M0 500 V200 C0 89 89 0 200 0 C311 0 400 89 400 200 V440 L340 500 Z"
                stroke="#c9a24f"
                strokeOpacity="0.7"
                strokeWidth="1.5"
              />
            </svg>

            {/* the image itself */}
            <div className="cs-img absolute inset-0" style={{ clipPath: "url(#craft-arch)" }}>
              <div className="relative h-full w-full overflow-hidden bg-gradient-to-br from-[#3a2c14] to-[#1c150a]">
                <img
              src="https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=1000&q=85"
                  alt="A goldsmith shaping a bridal necklace by hand"
                  loading="lazy"
                  draggable="false"
                  onError={(e) => (e.currentTarget.style.display = "none")}
                  className="cs-frame-img h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                <div className="cs-shine pointer-events-none absolute inset-0 bg-[linear-gradient(115deg,transparent_42%,rgba(255,232,180,0.30)_50%,transparent_58%)]" />
              </div>
            </div>

            {/* small floating note */}
            <div
              className="cs-rv absolute -left-3 bottom-14 z-10 sm:-left-8"
              style={{ "--d": "1100ms" }}
            >
              <div className="cs-badge border border-[#c9a24f]/40 bg-[#1a140b]/90 px-4 py-3 backdrop-blur-sm">
                <p className="text-[10px] uppercase tracking-[0.3em] text-[#e3b968]">Workshop</p>
                <p className="mt-1 font-serif text-base text-[#f3ead6]">Finished by hand,<br />piece by piece</p>
              </div>
            </div>
          </div>
        </div>

        {/* ---------------- Text + cards ---------------- */}
        <div className="lg:col-span-7">
          <p
            className="cs-rv text-[11px] font-medium uppercase tracking-[0.4em] text-[#e3b968]"
            style={{ "--d": "200ms" }}
          >
            Our Craft
          </p>

          <h2
            className="cs-rv mt-4 font-serif text-4xl leading-[1.1] text-[#f7efdc] sm:text-5xl"
            style={{ "--d": "350ms" }}
          >
            Made slowly, <span className="italic text-[#e3b968]">by hand</span>,
            <br className="hidden sm:block" /> in our own workshop
          </h2>

          <p
            className="cs-rv mt-6 max-w-xl text-[15px] leading-relaxed text-neutral-300"
            style={{ "--d": "500ms" }}
          >
            Every necklace, bangle and ring is shaped, set and polished by our own
            karigars, then hallmarked and weighed in front of you. No middlemen,
            no hidden making charges, just gold you can trust.
          </p>

          <div
            className="cs-rv mt-8 grid max-w-lg grid-cols-3 gap-6 border-y border-[#c9a24f]/20 py-6"
            style={{ "--d": "650ms" }}
          >
            {STATS.map((s) => (
              <Stat key={s.label} {...s} start={inView} />
            ))}
          </div>

          {/* Overlapping collection cards */}
          <div
            className="cs-rv mt-10 flex items-center justify-between"
            style={{ "--d": "800ms" }}
          >
            <p className="text-[11px] uppercase tracking-[0.3em] text-neutral-400">
              Browse by collection
            </p>
            <Link
              to="/shop"
              className="border-b border-[#c9a24f]/60 pb-0.5 text-[12px] font-medium uppercase tracking-[0.2em] text-[#f3ead6] transition-colors hover:text-[#e3b968]"
            >
              Visit showroom
            </Link>
          </div>

          <div className="cs-scroll -mx-4 flex overflow-x-auto px-4 pb-6 pt-8 lg:mx-0 lg:overflow-visible lg:px-0">
            {COLLECTIONS.map((c, i) => (
              <Link
                key={c.name}
                to={c.href}
                className={`cs-card group relative z-0 block flex-none hover:z-30 focus-visible:z-30 focus-visible:outline-none ${
                  i > 0 ? "-ml-14" : ""
                }`}
                style={{ "--d": `${950 + i * 150}ms`, marginTop: i % 2 ? "1.75rem" : 0 }}
              >
                <div className="relative h-72 w-48 overflow-hidden rounded-t-[6rem] bg-gradient-to-b from-[#3a2c14] to-[#1c150a] shadow-[0_10px_30px_-12px_rgba(0,0,0,0.8)] ring-1 ring-[#c9a24f]/25 transition-all duration-500 ease-out group-hover:-translate-y-6 group-hover:scale-[1.05] group-hover:shadow-[0_30px_50px_-15px_rgba(0,0,0,0.9)] group-hover:ring-[#e3b968]/70 group-focus-visible:-translate-y-6 group-focus-visible:scale-[1.05]">
                  <img
                    src={c.image}
                    alt=""
                    loading="lazy"
                    draggable="false"
                    onError={(e) => (e.currentTarget.style.display = "none")}
                    className="h-full w-full object-cover brightness-[0.7] saturate-[0.85] transition-all duration-700 group-hover:scale-110 group-hover:brightness-100 group-hover:saturate-100"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <p className="font-serif text-lg leading-tight text-[#f7efdc]">{c.name}</p>
                    <p className="mt-1 flex items-center gap-1.5 text-[11px] uppercase tracking-[0.16em] text-[#e3b968]">
                      {c.count}
                      <svg viewBox="0 0 24 24" className="h-3 w-3 -translate-x-1 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
