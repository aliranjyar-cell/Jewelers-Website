import { Link } from 'react-router';
import { ArrowRight, ClipboardCheck, ImagePlus, MessageSquareText } from 'lucide-react';

const steps = [
  {
    icon: MessageSquareText,
    title: 'Share your idea',
    description: 'Tell us the occasion, design, preferred metal and purity, size or approximate weight, and budget range.',
  },
  {
    icon: ImagePlus,
    title: 'Add references',
    description: 'Bring a sketch or reference images so our jewellers can understand the look you have in mind.',
  },
  {
    icon: ClipboardCheck,
    title: 'We review and quote',
    description: 'Our team checks what is possible, then shares a quote and next steps for your approval.',
  },
];

export default function CustomOrderIntro() {
  return (
    <section className="relative overflow-hidden bg-[#f3eee4] px-5 py-16 sm:px-8 sm:py-20 lg:px-12 lg:py-24" aria-labelledby="custom-order-heading">
      <div aria-hidden="true" className="pointer-events-none absolute -left-24 top-12 h-72 w-72 rounded-full bg-[#d5b56c]/15 blur-[90px]" />
      <div className="relative mx-auto grid max-w-[1400px] gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-16">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#987541]">Made for your moment</p>
          <h2 id="custom-order-heading" className="mt-4 max-w-xl font-serif text-4xl font-light leading-tight text-[#30291f] sm:text-5xl lg:text-6xl">Have a piece in mind?</h2>
          <p className="mt-5 max-w-xl text-sm leading-7 text-[#746c60] sm:text-base sm:leading-8">
            We can discuss made-to-order rings, bridal jewellery, necklaces, bangles, and redesigns. Tell us what you have in mind and our jewellers will confirm what is possible.
          </p>
          <p className="mt-4 max-w-xl text-sm leading-7 text-[#746c60]">
            Include the occasion, design details, preferred metal and purity, size or approximate weight, and budget range. You can also share sketches or reference images.
          </p>
          <Link to="/custom-order" className="group mt-8 inline-flex items-center gap-3 rounded-full bg-[#211a12] px-6 py-3.5 text-xs font-medium uppercase tracking-[0.16em] text-white shadow-lg shadow-[#4c3514]/10 transition duration-300 hover:-translate-y-0.5 hover:bg-[#73552a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b99a60] focus-visible:ring-offset-2">
            Start a custom request <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>

        <div className="border border-[#d7c8aa] bg-[#fbf9f4] p-6 shadow-[0_20px_60px_rgba(71,51,21,0.06)] sm:p-9">
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[#987541]">A simple process</p>
          <ol className="mt-6 divide-y divide-[#e4dccd]">
            {steps.map((step, index) => {
              const Icon = step.icon;
              return (
                <li key={step.title} className="flex gap-4 py-5 first:pt-0 last:pb-0 sm:gap-5">
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full border border-[#d8c59d] bg-[#f6f0e4] text-[#987541]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
                  <div className="min-w-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a59069]">Step 0{index + 1}</p>
                    <h3 className="mt-1 font-serif text-lg text-[#30291f]">{step.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-[#746c60]">{step.description}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 border-t border-[#e4dccd] pt-5 text-xs leading-6 text-[#766d5f]">
            Sending a request does not place an order or confirm a final price. Your order begins only after you review and accept our quote.
          </p>
        </div>
      </div>
    </section>
  );
}
