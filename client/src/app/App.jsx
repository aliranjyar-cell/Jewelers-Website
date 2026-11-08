import { Link, Navigate, Route, Routes } from 'react-router';
import AdminLoginPage from '../features/admin/AdminLoginPage.jsx';
import AdminLayout from '../features/admin/AdminLayout.jsx';
import AdminDashboardPage from '../features/admin/AdminDashboardPage.jsx';
import MetalRatesPage from '../features/admin/MetalRatesPage.jsx';
import ProductsPage from '../features/admin/ProductsPage.jsx';
import ProductFormPage from '../features/admin/ProductFormPage.jsx';
import StoreProductPage from '../features/catalog/pages/StoreProductPage.jsx';


function StoreHome() {
  return (
    <main className="min-h-screen bg-stone-50 text-stone-900">
      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
        <Link to="/" className="text-lg font-semibold tracking-[0.18em]">JEWELRY HOUSE</Link>
        <nav className="flex gap-6 text-sm" aria-label="Main navigation">
          <Link to="/shop">Shop</Link>
          <Link to="/custom-order">Custom order</Link>
        </nav>
      </header>
      <section className="mx-auto grid min-h-[70vh] max-w-7xl items-center gap-10 px-6 py-16 md:grid-cols-2">
        <div>
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-amber-800">Made with care in Pakistan</p>
          <h1 className="max-w-xl text-5xl font-light leading-tight md:text-7xl">Jewelry for the moments you keep.</h1>
          <p className="mt-6 max-w-lg text-stone-600">Explore rings, necklaces, and chains, or work with us to create a custom piece.</p>
          <Link to="/shop" className="mt-8 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm text-white">Explore collection</Link>
        </div>
        <div className="flex min-h-80 items-center justify-center rounded-3xl bg-gradient-to-br from-amber-100 via-stone-100 to-stone-200 p-10 text-center text-sm text-stone-500">
          Product photography will appear here
        </div>
      </section>
      <footer className="border-t border-stone-200 px-6 py-6 text-center text-xs text-stone-500">Quetta, Pakistan · Jewelry Store</footer>
    </main>
  );
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
      <Route path="/" element={<StoreHome />} />
      <Route path="/shop" element={<ComingSoon title="Shop" />} />
      <Route path="/shop/:slug" element={<StoreProductPage />} />
      <Route path="/custom-order" element={<ComingSoon title="Custom order" />} />

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Every page inside here gets the sidebar + header and is protected by the layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminComingSoon title="Orders" />} />
        <Route path="orders/:orderId" element={<AdminComingSoon title="Order details" />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId/edit" element={<ProductFormPage />} />
        <Route path="metal-rates" element={<MetalRatesPage />} />
        <Route path="custom-requests" element={<AdminComingSoon title="Custom requests" />} />
        <Route path="custom-requests/:requestId" element={<AdminComingSoon title="Custom request details" />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
  );
}
