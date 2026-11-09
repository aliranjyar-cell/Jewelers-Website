
import { useEffect, useState } from "react";
import { Link } from "react-router";
import ProductCard from "./ProductCard";
import { publicProducts } from "../../../../lib/api.js";

const MAX_CARDS = 12;

/* ----------------------------------
   Small floating golden bubbles
---------------------------------- */

function FloatingBubbles() {
  const bubbles = [
    { size: 9, x: "7%", y: "15%", delay: "0s", duration: "13s" },
    { size: 13, x: "17%", y: "72%", delay: "-4s", duration: "17s" },
    { size: 7, x: "29%", y: "35%", delay: "-7s", duration: "15s" },
    { size: 11, x: "42%", y: "82%", delay: "-2s", duration: "18s" },
    { size: 8, x: "54%", y: "18%", delay: "-9s", duration: "14s" },
    { size: 14, x: "66%", y: "65%", delay: "-5s", duration: "19s" },
    { size: 8, x: "77%", y: "28%", delay: "-3s", duration: "16s" },
    { size: 11, x: "89%", y: "75%", delay: "-8s", duration: "15s" },
    { size: 6, x: "95%", y: "12%", delay: "-6s", duration: "12s" },
    { size: 10, x: "35%", y: "55%", delay: "-10s", duration: "20s" },
    { size: 7, x: "73%", y: "90%", delay: "-1s", duration: "16s" },
    { size: 12, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 12, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 12, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 12, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 22, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 11, x: "12%", y: "45%", delay: "-11s", duration: "18s" },
    { size: 27, x: "66%", y: "45%", delay: "-11s", duration: "18s" },
  ];

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      {bubbles.map((bubble, index) => (
        <span
          key={index}
          className="gold-bubble absolute rounded-full"
          style={{
            width: `${bubble.size}px`,
            height: `${bubble.size}px`,
            left: bubble.x,
            top: bubble.y,
            animationDelay: bubble.delay,
            animationDuration: bubble.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ----------------------------------
   Decorative background waves
---------------------------------- */

function WaveBackground() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 1440 700"
        preserveAspectRatio="none"
        fill="none"
      >
        <path
          d="M-100 180 C200 80 350 280 650 180 S1100 80 1540 190"
          stroke="#b8914a"
          strokeWidth="1"
          strokeOpacity="0.18"
        />

        <path
          d="M-100 480 C250 370 400 570 750 450 S1200 360 1540 470"
          stroke="#b8914a"
          strokeWidth="1"
          strokeOpacity="0.14"
        />

        <path
          d="M-100 620 C250 530 500 690 800 590 S1250 510 1540 620"
          stroke="#b8914a"
          strokeWidth="1"
          strokeOpacity="0.10"
        />
      </svg>
    </div>
  );
}

/* ----------------------------------
   Product row
---------------------------------- */

function ProductRow({
  items,
  wishlist,
  onToggleWish,
  label,
}) {
  return (
    <div
      role="region"
      aria-label={label}
      tabIndex={0}
      className="product-row-scroll flex gap-0 overflow-x-auto overflow-y-hidden px-2 py-8 focus:outline-none focus-visible:ring-1 focus-visible:ring-amber-600/40"
    >
      {items.map((product, index) => (
        <div
          key={product.id}
          className={`w-[82%] flex-none sm:w-[48%] md:w-[33.333%] lg:w-[25%] ${index ? '-ml-12' : ''}`}
        >
          <ProductCard
            product={product}
            wished={wishlist.has(product.id)}
            onToggleWish={onToggleWish}
          />
        </div>
      ))}
    </div>
  );
}

/* ----------------------------------
   Main products section
---------------------------------- */

export default function ProductsSection() {
  const [wishlist, setWishlist] = useState(() => {
    try { return new Set(JSON.parse(window.localStorage.getItem('zareen-wishlist') || '[]')); }
    catch { return new Set(); }
  });
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const toggleWish = (id) => {
    setWishlist((previous) => {
      const next = new Set(previous);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      try { window.localStorage.setItem('zareen-wishlist', JSON.stringify([...next])); } catch { /* storage is optional */ }

      return next;
    });
  };

  useEffect(() => {
    let cancelled = false;
    publicProducts.list({ pageSize: MAX_CARDS })
      .then((result) => {
        if (!cancelled) {
          setProducts(Array.isArray(result?.items) ? result.items.slice(0, MAX_CARDS) : []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  const displayProducts = loading ? [] : products.slice(0, MAX_CARDS);

  const half = Math.ceil(displayProducts.length / 2);

  const rows = [
    displayProducts.slice(0, half),
    displayProducts.slice(half),
  ];

  return (
    <section className="relative isolate overflow-hidden bg-gradient-to-br from-[#fcf9f1] via-[#f8f1e4] to-[#f3ead8] py-20 sm:py-24">

      <style>{`

        /* ----------------------------------
           Floating bubbles
        ---------------------------------- */

        .gold-bubble {
          background: radial-gradient(
            circle at 35% 30%,
            rgba(255, 255, 255, 0.95),
            rgba(205, 167, 95, 0.35) 55%,
            rgba(184, 145, 74, 0.12) 100%
          );

          border: 1px solid rgba(184, 145, 74, 0.24);

          box-shadow:
            0 0 8px rgba(184, 145, 74, 0.12),
            inset 0 0 4px rgba(255, 255, 255, 0.8);

          opacity: 0.65;

          animation: bubble-drift ease-in-out infinite alternate;

          will-change: transform;
        }

        @keyframes bubble-drift {
          0% {
            transform: translate3d(0, 0, 0);
          }

          25% {
            transform: translate3d(9px, -13px, 0);
          }

          50% {
            transform: translate3d(-7px, -23px, 0);
          }

          75% {
            transform: translate3d(12px, -10px, 0);
          }

          100% {
            transform: translate3d(-8px, 8px, 0);
          }
        }

        /* ----------------------------------
           Product horizontal scrolling
        ---------------------------------- */

        .product-row-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(184, 145, 74, 0.55) transparent;
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }

        .product-row-scroll::-webkit-scrollbar {
          height: 5px;
        }

        .product-row-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .product-row-scroll::-webkit-scrollbar-thumb {
          background: rgba(184, 145, 74, 0.5);
          border-radius: 999px;
        }

        /* ----------------------------------
           Product card hover movement
        ---------------------------------- */

        .product-row-scroll > div {
          transition: transform 400ms ease;
        }

        .product-row-scroll > div:hover {
          transform: translateY(-6px);
        }

        /* ----------------------------------
           Reduced motion accessibility
        ---------------------------------- */

        @media (prefers-reduced-motion: reduce) {
          .gold-bubble {
            animation: none !important;
          }

          .product-row-scroll {
            scroll-behavior: auto;
          }

          .product-row-scroll > div {
            transition: none;
          }
        }

      `}</style>

      {/* Background effects */}
      <FloatingBubbles />
      <WaveBackground />

      {/* Soft ambient light */}
      <div
        className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-amber-200/20 blur-[100px]"
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -right-32 bottom-10 h-96 w-96 rounded-full bg-yellow-100/40 blur-[110px]"
        aria-hidden="true"
      />

      {/* Main content */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Heading */}
        <div className="flex flex-col gap-5 px-4 sm:flex-row sm:items-end sm:justify-between">

          <div>
            <div className="flex items-center gap-3">
              {/* <span className="h-px w-9 bg-amber-600" /> */}

              <p className="text-[11px] font-medium uppercase tracking-[0.4em] text-amber-800">
                New Arrivals
              </p>
            </div>

            <h2 className="mt-4 max-w-2xl font-serif text-3xl leading-tight text-neutral-900 sm:text-4xl lg:text-5xl">
              Pieces our customers keep coming back for
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-neutral-600">
              Discover timeless craftsmanship and beautifully designed
              jewellery, created to make every moment special.
            </p>
          </div>

          <Link
            to="/shop"
            className="group flex w-fit items-center gap-3 border-b border-neutral-900/30 pb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-neutral-800 transition-all hover:border-amber-700 hover:text-amber-800"
          >
            View all designs

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </Link>
        </div>

        {/* Product rows */}
        <div className="mt-8 space-y-2">

          <ProductRow
            items={rows[0]}
            wishlist={wishlist}
            onToggleWish={toggleWish}
            label="Featured gold jewellery, row 1"
          />

          <ProductRow
            items={rows[1]}
            wishlist={wishlist}
            onToggleWish={toggleWish}
            label="Featured gold jewellery, row 2"
          />

          {!loading && products.length === 0 && <p className="px-4 py-10 text-center text-sm text-neutral-600">Our new arrivals are being prepared. Please visit the shop again soon.</p>}

        </div>

        {/* Bottom decoration */}
        <div className="mt-10 flex items-center justify-center gap-3">
          <span className="h-px w-12 bg-amber-700/30" />

          <span className="h-1.5 w-1.5 rotate-45 border border-amber-700/60" />

          <span className="text-[10px] uppercase tracking-[0.35em] text-neutral-500">
            Crafted with elegance
          </span>

          <span className="h-1.5 w-1.5 rotate-45 border border-amber-700/60" />

          <span className="h-px w-12 bg-amber-700/30" />
        </div>

      </div>
    </section>
  );
}
