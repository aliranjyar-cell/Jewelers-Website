import { Link, Navigate, Route, Routes, useParams } from 'react-router';
import AdminLoginPage from '../features/admin/AdminLoginPage.jsx';
import AdminLayout from '../features/admin/AdminLayout.jsx';
import AdminDashboardPage from '../features/admin/AdminDashboardPage.jsx';
import MetalRatesPage from '../features/admin/MetalRatesPage.jsx';
import ProductsPage from '../features/admin/ProductsPage.jsx';
import ProductFormPage from '../features/admin/ProductFormPage.jsx';
import StoreProductPage from '../features/catalog/pages/StoreProductPage.jsx';
import HomePage from '../features/catalog/pages/HomePage.jsx';
import ShopPage from '../features/catalog/pages/ShopPage.jsx';
import InventoryPage from '../features/admin/InventoryPage.jsx';
import OrdersPage from '../features/admin/OrdersPage.jsx';
import OrderDetailPage from '../features/admin/OrderDetailPage.jsx';
import StorefrontLayout from '../features/catalog/layout/StorefrontLayout.jsx';

function LegacyProductRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/shop/${encodeURIComponent(slug || '')}`} replace />;
}

function StoreInfoPage({ title, description, note }) {
  return <main className="grid min-h-[70vh] place-items-center px-5 py-16 text-center"><div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-800">Zareen Jewellers</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">{title}</h1><p className="mt-5 text-sm leading-7 text-stone-600">{description}</p>{note && <p className="mt-5 border border-amber-200 bg-amber-50 px-5 py-4 text-left text-xs leading-6 text-amber-950">{note}</p>}<a href="tel:+923128001212" className="mt-7 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm text-white hover:bg-stone-700">Call +92 312 800 1212</a><p className="mt-3 text-xs text-stone-500">Mon–Sat, 11:00 am–8:00 pm</p><Link to="/shop" className="mt-6 block text-xs font-medium uppercase tracking-[0.16em] text-amber-800">Browse the collection</Link></div></main>;
}

function AdminComingSoon({ title }) {
  return (
    <section className="rounded-3xl bg-white p-8 ring-1 ring-black/5 dark:bg-[#141416] dark:ring-white/10">
      <h1 className="text-2xl font-semibold text-neutral-950 dark:text-white">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        This area is part of the implementation roadmap.
      </p>
    </section>
  );
}

function ComingSoon({ title }) {
  return (
    <main className="min-h-screen bg-stone-50 p-8 text-stone-900 dark:bg-[#0A0A0B] dark:text-white">
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">This area is part of the implementation roadmap.</p>
    </main>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:slug" element={<StoreProductPage />} />
        <Route path="product/:slug" element={<LegacyProductRedirect />} />
        <Route path="custom-order" element={<StoreInfoPage title="A piece made for you" description="Ask us about made-to-order rings, bridal jewellery, necklaces, bangles, and redesigns. Share the occasion, design, preferred metal and purity, size or approximate weight, budget range, and any sketches or reference images. Our jewellers will review your request and provide a quote with next steps." note="Sending a request does not place an order or confirm a final price. An order is confirmed only after you review and accept the quote." />} />
        <Route path="gold-rate" element={<StoreInfoPage title="Today’s gold rate" description="Gold prices change throughout the day. Contact our team for the latest rate before placing an order or visiting the showroom." />} />
        <Route path="contact" element={<StoreInfoPage title="Talk with our team" description="Contact Zareen Jewellers in Quetta for product questions, delivery coverage and timelines, accepted payment methods, or return and exchange terms. We’ll confirm the details for your order before you decide." />} />
        <Route path="about" element={<StoreInfoPage title="Made with care in Quetta" description="Zareen Jewellers brings together careful craftsmanship, considered design, and personal service for every piece." />} />
        <Route path="gold" element={<Navigate to="/shop" replace />} />
        <Route path="bridal" element={<Navigate to="/shop" replace />} />
        <Route path="bullion" element={<Navigate to="/shop" replace />} />
        <Route path="collections" element={<Navigate to="/shop" replace />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Every page inside here gets the sidebar + header and is protected by the layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<OrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId/edit" element={<ProductFormPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="metal-rates" element={<MetalRatesPage />} />
        <Route path="custom-requests" element={<AdminComingSoon title="Custom requests" />} />
        <Route path="custom-requests/:requestId" element={<AdminComingSoon title="Custom request details" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
  );
}
