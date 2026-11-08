import { Link, Navigate, Route, Routes } from 'react-router';
import AdminLoginPage from '../features/admin/AdminLoginPage.jsx';
import AdminLayout from '../features/admin/AdminLayout.jsx';

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

function ComingSoon({ title }) {
  return <main className="p-10"><Link to="/" className="underline">Home</Link><h1 className="mt-8 text-3xl">{title}</h1><p className="mt-3 text-stone-600">This area is part of the implementation roadmap.</p></main>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<StoreHome />} />
      <Route path="/shop" element={<ComingSoon title="Shop" />} />
      <Route path="/custom-order" element={<ComingSoon title="Custom order" />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/admin" element={<AdminLayout />} />
      <Route path="/admin/*" element={<Navigate to="/admin" replace />} />
      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
  );
}
