
import {
  Gem,
  Sparkles,
  ShieldCheck,
  PackageCheck,
  ArrowRight,
} from "lucide-react";
import { Link } from "react-router";
import { useStoreBrand } from '../../../../contexts/StoreBrandContext.jsx';

const features = [
  {
    icon: Gem,
    title: "Premium Quality",
    description:
      "Thoughtfully selected materials and careful attention to every detail.",
  },
  {
    icon: Sparkles,
    title: "Timeless Designs",
    description:
      "Elegant jewelry designed to complement your style and every occasion.",
  },
  {
    icon: ShieldCheck,
    title: "Quality Assurance",
    description:
      "Every piece receives careful attention to ensure a beautiful finish.",
  },
  {
    icon: PackageCheck,
    title: "Beautiful Packaging",
    description:
      "Every order is presented with care, making each purchase feel special.",
  },
];

export default function WhyChooseZareen() {
  const { storeName } = useStoreBrand();
  return (
    <section className="relative overflow-hidden bg-[#F8F5EF] px-5 py-20 sm:px-8 lg:px-16 lg:py-28">

      {/* Decorative background */}
      <div className="pointer-events-none absolute -left-32 top-10 h-72 w-72 rounded-full bg-[#D8BD88]/10 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-72 w-72 rounded-full bg-[#D8BD88]/10 blur-3xl" />

      <div className="relative mx-auto max-w-7xl">

        {/* Section Heading */}
        <div className="mx-auto mb-16 max-w-2xl text-center">

          <span className="mb-4 inline-block text-[11px] font-semibold uppercase tracking-[0.35em] text-[#A8894E]">
            The {storeName} Difference
          </span>

          <h2 className="font-serif text-3xl leading-tight text-[#29251F] sm:text-4xl lg:text-5xl">
            Elegance in Every
            <span className="block italic text-[#A8894E]">
              Little Detail
            </span>
          </h2>

          <div className="mx-auto my-6 h-px w-16 bg-[#B99A60]" />

          <p className="text-sm leading-7 text-[#777168] sm:text-base">
            More than just jewelry, {storeName} is about celebrating your
            individuality with beautiful designs, thoughtful details,
            and a touch of timeless elegance.
          </p>

        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div
                key={feature.title}
                className="group relative border border-[#DED5C5] bg-white/50 px-6 py-10 text-center transition-all duration-500 hover:-translate-y-2 hover:border-[#B99A60] hover:bg-white hover:shadow-[0_15px_45px_rgba(91,70,35,0.08)]"
              >
                {/* Number */}
                <span className="absolute right-5 top-4 text-xs tracking-widest text-[#B9A783]/70">
                  0{index + 1}
                </span>

                {/* Icon */}
                <div className="mx-auto mb-7 flex h-16 w-16 items-center justify-center rounded-full border border-[#DCCBA9] bg-[#F8F5EF] transition-all duration-500 group-hover:border-[#B99A60] group-hover:bg-[#B99A60]">
                  <Icon
                    size={27}
                    strokeWidth={1.3}
                    className="text-[#A8894E] transition-colors duration-500 group-hover:text-white"
                  />
                </div>

                {/* Content */}
                <h3 className="mb-3 font-serif text-xl text-[#302B24]">
                  {feature.title}
                </h3>

                <p className="text-sm leading-7 text-[#81796E]">
                  {feature.description}
                </p>

                {/* Bottom accent */}
                <div className="mx-auto mt-7 h-px w-8 bg-[#B99A60] transition-all duration-500 group-hover:w-16" />
              </div>
            );
          })}

        </div>

        {/* Bottom Text */}
        <div className="mt-14 text-center">
          <Link
            to="/shop"
            className="group inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#8F713D] transition-colors hover:text-[#302B24]"
          >
            Discover Our Collection
            <ArrowRight
              size={16}
              className="transition-transform duration-300 group-hover:translate-x-2"
            />
          </Link>
        </div>

      </div>
    </section>
  );
}
