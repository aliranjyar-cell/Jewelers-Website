
import React from "react";
import { Link } from "react-router";

const collections = [
  {
    id: 1,
    name: "Golden Radiance",
    subtitle: "Elegance that speaks",
    image:
      "https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=700&q=80",
    rotate: "-7deg",
  },
  {
    id: 2,
    name: "Modern Classics",
    subtitle: "Made for every moment",
    image:
      "https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=700&q=80",
    rotate: "0deg",
  },
  {
    id: 3,
    name: "Timeless Beauty",
    subtitle: "A touch of luxury",
    image:
      "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=700&q=80",
    rotate: "7deg",
  },
];

export default function ZareenShowcase() {
  return (
    <section className="zareen-showcase relative isolate overflow-hidden bg-[#F3EEE5] px-5 py-24 sm:px-8 lg:px-16 lg:py-32">

      <style>{`
        .zareen-showcase {
          --gold: #b99a60;
        }

        .showcase-glow {
          position: absolute;
          width: 450px;
          height: 450px;
          border-radius: 50%;
          background: rgba(190, 157, 100, 0.12);
          filter: blur(90px);
          pointer-events: none;
          animation: glow-drift 9s ease-in-out infinite alternate;
        }

        @keyframes glow-drift {
          from { transform: translate(0, 0); }
          to { transform: translate(45px, -35px); }
        }

        .showcase-heading {
          opacity: 0;
          animation: reveal-heading 1s ease forwards;
        }

        .showcase-visual {
          opacity: 0;
          animation: reveal-visual 1.2s cubic-bezier(.2,.8,.2,1) .25s forwards;
        }

        @keyframes reveal-heading {
          from {
            opacity: 0;
            transform: translateY(35px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes reveal-visual {
          from {
            opacity: 0;
            transform: translateY(55px) scale(.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .main-jewelry-image {
          clip-path: polygon(
            0 0,
            88% 0,
            100% 13%,
            100% 85%,
            88% 100%,
            12% 100%,
            0 87%
          );
          transition: transform 1s ease;
        }

        .main-jewelry-image:hover {
          transform: scale(1.025);
        }

        .collection-card {
          position: relative;
          transform: rotate(var(--card-rotation)) translateY(0);
          transition:
            transform .65s cubic-bezier(.2,.8,.2,1),
            box-shadow .65s ease,
            opacity .4s ease;
          cursor: pointer;
          transform-origin: bottom center;
        }

        .collection-card:hover {
          transform: rotate(0deg) translateY(-38px) scale(1.09);
          z-index: 30;
          box-shadow: 0 25px 55px rgba(45, 35, 22, .22);
        }

        .collection-card img {
          transition: transform .8s ease;
        }

        .collection-card:hover img {
          transform: scale(1.08);
        }

        .gold-particle {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #b99a60;
          opacity: .45;
          animation: particle-float 5s ease-in-out infinite alternate;
          pointer-events: none;
        }

        @keyframes particle-float {
          from { transform: translateY(0) scale(.8); opacity: .2; }
          to { transform: translateY(-30px) scale(1.3); opacity: .65; }
        }

        @media (prefers-reduced-motion: reduce) {
          .showcase-heading,
          .showcase-visual,
          .showcase-glow,
          .gold-particle {
            animation: none;
            opacity: 1;
          }

          .collection-card,
          .collection-card img,
          .main-jewelry-image {
            transition: none;
          }
        }
      `}</style>

      {/* Background glow */}
      <div className="showcase-glow -left-40 top-20" />
      <div className="showcase-glow -right-40 bottom-0" />

      {/* Decorative particles */}
      <div className="gold-particle left-[12%] top-[20%]" />
      <div className="gold-particle left-[30%] top-[65%]" />
      <div className="gold-particle right-[15%] top-[30%]" />
      <div className="gold-particle right-[35%] bottom-[15%]" />

      <div className="relative mx-auto max-w-7xl">

        {/* Heading */}
        <div className="showcase-heading mb-14 text-center lg:mb-20">

          <span className="mb-5 block text-[10px] font-semibold uppercase tracking-[.45em] text-[#A78A53]">
            Discover the ZAREEN World
          </span>

          <h2 className="font-serif text-4xl leading-tight text-[#30291F] sm:text-5xl lg:text-6xl">
            The Art of
            <span className="block italic text-[#AD8E54]">
              Timeless Elegance
            </span>
          </h2>

          <div className="mx-auto mt-7 h-px w-20 bg-[#B99A60]" />

          <p className="mx-auto mt-6 max-w-xl text-sm leading-8 text-[#81796E] sm:text-base">
            Discover the beauty of carefully chosen details.
            Every creation tells a story of elegance, individuality,
            and unforgettable moments.
          </p>

        </div>

        {/* Main Visual */}
        <div className="showcase-visual relative mx-auto max-w-6xl">

          <div className="relative h-[430px] overflow-hidden rounded-tl-[110px] rounded-br-[110px] sm:h-[540px] lg:h-[620px]">

            <img
              src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=1800&q=90"
              alt="Elegant ZAREEN jewelry collection"
              className="main-jewelry-image h-full w-full object-cover object-center"
            />

            {/* Image overlay */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/20 to-transparent" />

            {/* Image Content */}
            <div className="absolute bottom-16 left-7 max-w-md text-white sm:bottom-24 sm:left-14 lg:left-20">

              <span className="mb-5 block text-[10px] uppercase tracking-[.4em] text-[#E6C98E]">
                A Collection of Beauty
              </span>

              <h3 className="font-serif text-4xl leading-tight sm:text-5xl lg:text-6xl">
                Beauty Beyond
                <span className="block italic text-[#E6C98E]">
                  Ordinary
                </span>
              </h3>

              <p className="mt-5 max-w-sm text-sm leading-7 text-white/80">
                Discover pieces that make every moment
                a little more special.
              </p>

            <Link
                to="/shop"
                className="mt-8 inline-flex items-center gap-4 border border-white/60 px-7 py-4 text-[10px] font-semibold uppercase tracking-[.25em] transition-all duration-300 hover:border-[#D7B875] hover:bg-[#B99A60] hover:text-white"
              >
                Explore Collection
                <span className="text-lg">↗</span>
              </Link>

            </div>

            {/* Image corner decoration */}
            <div className="absolute right-7 top-7 hidden border border-white/40 px-5 py-3 text-[9px] uppercase tracking-[.3em] text-white sm:block">
              ZAREEN · EST. ELEGANCE
            </div>

          </div>

          {/* Layered Image Cards */}
          <div className="relative z-10 -mt-16 flex justify-center px-3 sm:-mt-24">

            <div className="flex items-end justify-center gap-2 sm:gap-5 lg:gap-8">

              {collections.map((item, index) => (
                <Link
                  to="/shop"
                  key={item.id}
                  className={`collection-card group w-[105px] sm:w-[170px] lg:w-[210px] ${
                    index === 1 ? "z-20" : "z-10"
                  }`}
                  style={{
                    "--card-rotation": item.rotate,
                  }}
                >

                  <div className="overflow-hidden border-[5px] rounded-bl-[60px] rounded-tr-[60px] border-[#F3EEE5] bg-white shadow-xl sm:border-[7px]">

                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={item.image}
                        alt={item.name}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="bg-[#FBF9F5] px-2 py-3 text-center sm:px-4 sm:py-5">
                      <h4 className="font-serif text-xs text-[#393126] sm:text-base">
                        {item.name}
                      </h4>

                      <p className="mt-1 text-[8px] text-[#9A8C77] sm:text-[10px]">
                        {item.subtitle}
                      </p>
                    </div>

                  </div>

                </Link>
              ))}

            </div>

          </div>

        </div>

        {/* Bottom caption */}
        <div className="mt-16 text-center sm:mt-20">

          <p className="font-serif text-lg italic text-[#8F7954] sm:text-xl">
            "Made to be remembered."
          </p>

          <div className="mx-auto mt-5 h-8 w-px bg-[#B99A60]" />

        </div>

      </div>
    </section>
  );
}
