import { Link } from 'react-router';
import { ArrowUpRight, CreditCard, MapPin, RefreshCw, Truck } from 'lucide-react';

const serviceDetails = [
  {
    icon: Truck,
    title: 'Delivery',
    description: 'Tell us your city and we’ll confirm delivery availability and an estimated timeframe.',
    link: 'Ask about delivery',
  },
  {
    icon: CreditCard,
    title: 'Payment',
    description: 'Contact us to confirm which payment methods are currently accepted.',
    link: 'Ask about payment',
  },
  {
    icon: RefreshCw,
    title: 'Returns & exchanges',
    description: 'Check the return or exchange terms for your chosen piece before placing an order.',
    link: 'Ask about a policy',
  },
];

export default function TrustServiceInfo() {
  return (
    <section className="bg-[#fbf9f4] px-5 py-14 sm:px-8 sm:py-16 lg:px-12" aria-labelledby="service-info-heading">
      <div className="mx-auto max-w-[1400px]">
        <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[#987541]">Here to help</p>
            <h2 id="service-info-heading" className="mt-2 font-serif text-3xl text-[#30291f] sm:text-4xl">Before you place an order</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#746c60]">Ask our team to confirm the details for your item and destination before you decide.</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {serviceDetails.map((item) => {
            const Icon = item.icon;
            return (
              <article key={item.title} className="border border-[#e1d8c8] bg-white/70 p-5 transition-colors duration-300 hover:border-[#c8ad73] sm:p-6">
                <span className="grid h-10 w-10 place-items-center rounded-full bg-[#f4eee2] text-[#967540]"><Icon className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
                <h3 className="mt-4 font-serif text-lg text-[#30291f]">{item.title}</h3>
                <p className="mt-2 min-h-[3rem] text-sm leading-6 text-[#746c60]">{item.description}</p>
                <Link to="/contact" className="group mt-4 inline-flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#806235] hover:text-[#30291f]">{item.link}<ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" /></Link>
              </article>
            );
          })}

          <article className="flex flex-col border border-[#d4bd8c]/70 bg-[#f5f0e6] p-5 sm:p-6 xl:col-span-1">
            <span className="grid h-10 w-10 place-items-center rounded-full border border-[#d8c59d] bg-[#fbf9f4] text-[#967540]"><MapPin className="h-[18px] w-[18px]" strokeWidth={1.6} /></span>
            <h3 className="mt-4 font-serif text-lg text-[#30291f]">Contact the store</h3>
            <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-[#746c60]"><MapPin className="mt-1 h-4 w-4 shrink-0 text-[#987541]" />Quetta, Pakistan</p>
            <p className="mt-2 text-sm leading-6 text-[#746c60]">For an order question or delivery check, sign in to review your order or send a custom request.</p>
            <Link to="/account/orders" className="mt-4 inline-flex items-center text-sm font-medium text-[#71552f] hover:text-[#30291f]">View your orders</Link>
          </article>
        </div>
      </div>
    </section>
  );
}
