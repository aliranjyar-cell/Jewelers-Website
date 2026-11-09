import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";

/* ------------------------------------------------------------------ */
/*  Put your own photos in /public/images (or change the paths below). */
/*  Use landscape images, around 1920px wide, compressed (<400 KB).
provide jsx code of  second sections which should contain :
background of section have smooth color and very small waved line moving the  line should not take attention of user too much because the focus should be on product cards
One  reusable product card which should have : 
the cards should have two sides radius and two sides without radius 
The card should be same as background till use does not bring mouse on it 
Some part of Bottom of several  cards should be under each other but head of cards should not  be  under each other  
cards should come at the top when user bring the mouse 
Cards should show a link of checkout in hover 
cards should have heart icon as adding for wishlist 
cards should contain main price as readable and clear text and one discounted  price which having overline and smaller text size than real price   
In this section when maximum number of  cards that should be displayed should be 12 
In this section two rows which each rows contain 4 of cards should be and user scroll should be horizontal  till cards end in each product cards row     */
/* ------------------------------------------------------------------ */
const SLIDES = [
  "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=2000&q=85",
  "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=2000&q=85",
];

const SLIDE_MS = 3500; // time each image stays
const FADE_MS = 2000; // cross-fade length

/* ------------------------------ Particles ------------------------------ */
function GoldDust() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let w = 0;
    let h = 0;
    let raf = 0;
    let particles = [];
    const mouse = { x: -9999, y: -9999 };
    const RADIUS = 150; // how far the cursor affects dust

    const make = () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.05 - Math.random() * 0.2, // slow upward drift
      r: 0.5 + Math.random() * 1.7,
      a: 0.25 + Math.random() * 0.55,
      tw: Math.random() * Math.PI * 2, // twinkle phase
      ts: 0.008 + Math.random() * 0.02,
    });

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.parentElement.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.min(Math.floor((w * h) / 9000), 110);
      particles = Array.from({ length: count }, make);
    };

    const tick = () => {
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        // react to the cursor: gentle push away, eased
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < RADIUS && dist > 0.01) {
          const force = (1 - dist / RADIUS) ** 2 * 1.1;
          p.vx += (dx / dist) * force * 0.5;
          p.vy += (dy / dist) * force * 0.5;
        }

        // damping keeps motion soft, then settle back to slow drift
        p.vx *= 0.96;
        p.vy *= 0.96;
        p.x += p.vx + 0.06 * Math.sin(p.tw);
        p.y += p.vy;
        p.tw += p.ts;

        // wrap around edges
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;

        const alpha = p.a * (0.65 + 0.35 * Math.sin(p.tw * 2));

        // soft halo + bright core
        ctx.beginPath();
        ctx.fillStyle = `rgba(232, 190, 105, ${alpha * 0.14})`;
        ctx.arc(p.x, p.y, p.r * 4, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.fillStyle = `rgba(250, 221, 150, ${alpha})`;
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(tick);
    };

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas.parentElement);

    const host = canvas.parentElement;
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);

    if (reduceMotion) {
      tick(); // draw one frame, then stop
      cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 z-20" aria-hidden="true" />;
}

/* -------------------------------- Hero -------------------------------- */
export default function Hero() {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setCurrent((c) => {
        setPrevious(c);
        return (c + 1) % SLIDES.length;
      });
    }, SLIDE_MS);
    return () => clearInterval(id);
  }, []);

  const goTo = (i) => {
    if (i === current) return;
    setPrevious(current);
    setCurrent(i);
  };

  return (
    <section
      className="relative isolate flex h-[calc(100svh-7rem)] min-h-[700px] w-full items-center justify-center overflow-hidden bg-neutral-950"
      aria-label="Welcome"
    >
      {/* Component-scoped styles: font, slow zoom, entrance */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500&family=Jost:wght@300;400;500&display=swap');

        .hero-serif { font-family: 'Cormorant Garamond', Georgia, serif; }
        .hero-sans  { font-family: 'Jost', system-ui, sans-serif; }

        @keyframes hero-zoom {
          from { transform: scale(1.02); }
          to   { transform: scale(1.14); }
        }
        @keyframes hero-rise {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .hero-zoom { animation: hero-zoom ${(SLIDE_MS + FADE_MS) * 1.4}ms ease-out forwards; }
        .hero-rise { opacity: 0; animation: hero-rise 1100ms cubic-bezier(.2,.7,.2,1) forwards; }

        @media (prefers-reduced-motion: reduce) {
          .hero-zoom, .hero-rise { animation: none; opacity: 1; }
        }
      `}</style>

      {/* Background slides */}
      <div className="absolute inset-0 z-0">
        {SLIDES.map((src, i) => {
          const active = i === current;
          const animating = active || i === previous;
          return (
            <div
              key={src}
              className={`absolute inset-0 bg-cover bg-center will-change-[opacity,transform] ${
                animating ? "hero-zoom" : ""
              }`}
              style={{
                backgroundImage: `url(${src})`,
                opacity: active ? 1 : 0,
                transition: `opacity ${FADE_MS}ms ease-in-out`,
              }}
            />
          );
        })}
      </div>

      {/* Legibility overlays */}
      <div className="absolute inset-0 z-10 bg-neutral-950/55" />
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-black/50 via-transparent to-black/70" />
      <div className="absolute inset-0 z-10 [background:radial-gradient(ellipse_at_center,transparent_35%,rgba(0,0,0,0.55)_100%)]" />

      {/* Particles */}
      <GoldDust />

      {/* Content */}
      <div className="pointer-events-none relative z-30 mx-auto flex max-w-4xl flex-col items-center px-6 text-center">
        <p
          className="hero-sans hero-rise text-[11px] font-medium uppercase tracking-[0.45em] text-amber-300/90 sm:text-xs"
          style={{ animationDelay: "150ms" }}
        >
          Hallmarked 22K &amp; 24K Gold &nbsp;·&nbsp; Since 1987
        </p>

        <div
          className="hero-rise my-6 h-px w-16 bg-gradient-to-r from-transparent via-amber-400/80 to-transparent"
          style={{ animationDelay: "300ms" }}
        />

        <h1
          className="hero-serif hero-rise text-[2.6rem] font-semibold leading-[1.08] text-[#f7efdc] sm:text-6xl lg:text-7xl"
          style={{
            animationDelay: "450ms",
            textShadow: "0 2px 30px rgba(0,0,0,0.55)",
          }}
        >
          Crafted in Gold,
          <br />
          <span className="italic font-medium text-[#e3b968]">Kept for Generations</span>
        </h1>

        <p
          className="hero-sans hero-rise mt-6 max-w-xl text-[15px] font-light leading-relaxed text-neutral-200/90 sm:text-base"
          style={{ animationDelay: "650ms" }}
        >
          Bridal sets, everyday gold and investment bars, made by our own
          karigars and sold at honest daily rates.
        </p>

        <div
          className="hero-sans hero-rise pointer-events-auto mt-10 flex flex-col items-center gap-3 sm:flex-row sm:gap-4"
          style={{ animationDelay: "850ms" }}
        >
          <Link
            to="/shop"
            className="min-w-[200px] bg-[#c9a24f] px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-neutral-950 transition-colors duration-300 hover:bg-[#ddb764]"
          >
            Explore Collection
          </Link>
          <Link
            to="/gold-rate"
            className="min-w-[200px] border border-[#e3b968]/70 px-8 py-3.5 text-[13px] font-medium uppercase tracking-[0.2em] text-[#f7efdc] transition-colors duration-300 hover:bg-white/10"
          >
            Today’s Gold Rate
          </Link>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-7 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => goTo(i)}
            aria-label={`Show slide ${i + 1}`}
            aria-current={i === current}
            className="group py-3"
          >
            <span
              className={`block h-[2px] transition-all duration-500 ${
                i === current
                  ? "w-10 bg-[#e3b968]"
                  : "w-5 bg-white/40 group-hover:bg-white/70"
              }`}
            />
          </button>
        ))}
      </div>
    </section>
  );
}
