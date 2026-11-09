import { lazy, Suspense } from 'react';
import { Link, Navigate, Route, Routes, useParams } from 'react-router';
import { useStoreBrand } from '../contexts/StoreBrandContext.jsx';

const AdminLoginPage = lazy(() => import('../features/admin/AdminLoginPage.jsx'));
const AdminLayout = lazy(() => import('../features/admin/AdminLayout.jsx'));
const AdminDashboardPage = lazy(() => import('../features/admin/AdminDashboardPage.jsx'));
const MetalRatesPage = lazy(() => import('../features/admin/MetalRatesPage.jsx'));
const ProductsPage = lazy(() => import('../features/admin/ProductsPage.jsx'));
const ProductFormPage = lazy(() => import('../features/admin/ProductFormPage.jsx'));
const StoreProductPage = lazy(() => import('../features/catalog/pages/StoreProductPage.jsx'));
const HomePage = lazy(() => import('../features/catalog/pages/HomePage.jsx'));
const ShopPage = lazy(() => import('../features/catalog/pages/ShopPage.jsx'));
const InventoryPage = lazy(() => import('../features/admin/InventoryPage.jsx'));
const AdminOrdersPage = lazy(() => import('../features/admin/OrdersPage.jsx'));
const OrderDetailPage = lazy(() => import('../features/admin/OrderDetailPage.jsx'));
const CustomRequestsPage = lazy(() => import('../features/admin/CustomRequestsPage.jsx'));
const CustomRequestDetailPage = lazy(() => import('../features/admin/CustomRequestDetailPage.jsx'));
const CampaignsPage = lazy(() => import('../features/admin/CampaignsPage.jsx'));
const StoreSettingsPage = lazy(() => import('../features/admin/StoreSettingsPage.jsx'));
const CartPage = lazy(() => import('../features/cart/CartPage.jsx'));
const CheckoutPage = lazy(() => import('../features/checkout/CheckoutPage.jsx'));
const OrderConfirmationPage = lazy(() => import('../features/checkout/OrderConfirmationPage.jsx'));
const StorefrontLayout = lazy(() => import('../features/catalog/layout/StorefrontLayout.jsx'));
const LoginPage = lazy(() => import('../features/account/LoginPage.jsx'));
const RegisterPage = lazy(() => import('../features/account/RegisterPage.jsx'));
const AccountPage = lazy(() => import('../features/account/AccountPage.jsx'));
const CustomerOrdersPage = lazy(() => import('../features/account/OrdersPage.jsx'));
const CustomOrderPage = lazy(() => import('../features/custom-orders/CustomOrderPage.jsx'));

function LegacyProductRedirect() {
  const { slug } = useParams();
  return <Navigate to={`/shop/${encodeURIComponent(slug || '')}`} replace />;
}

function StoreInfoPage({ title, description, note }) {
  const { storeName } = useStoreBrand();
  return <main className="grid min-h-[70vh] place-items-center px-5 py-16 text-center"><div className="max-w-xl"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-800">{storeName}</p><h1 className="mt-4 font-serif text-4xl sm:text-5xl">{title}</h1><p className="mt-5 text-sm leading-7 text-stone-600">{description}</p>{note && <p className="mt-5 border border-amber-200 bg-amber-50 px-5 py-4 text-left text-xs leading-6 text-amber-950">{note}</p>}<Link to="/shop" className="mt-7 inline-flex rounded-full bg-stone-900 px-6 py-3 text-sm text-white hover:bg-stone-700">Browse the collection</Link></div></main>;
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
    <Suspense fallback={<main className="grid min-h-[60vh] place-items-center bg-[#fbfaf8] text-sm text-stone-500">Loading page…</main>}>
    <Routes>
      <Route path="/" element={<StorefrontLayout />}>
        <Route index element={<HomePage />} />
        <Route path="shop" element={<ShopPage />} />
        <Route path="shop/:slug" element={<StoreProductPage />} />
        <Route path="cart" element={<CartPage />} />
        <Route path="checkout" element={<CheckoutPage />} />
        <Route path="order-confirmation/:orderNumber" element={<OrderConfirmationPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="account" element={<AccountPage />} />
        <Route path="account/orders" element={<CustomerOrdersPage />} />
        <Route path="product/:slug" element={<LegacyProductRedirect />} />
        <Route path="custom-order" element={<CustomOrderPage />} />
        <Route path="gold-rate" element={<StoreInfoPage title="Today’s gold rate" description="Gold prices change throughout the day. Contact our team for the latest rate before placing an order or visiting the showroom." />} />
        <Route path="contact" element={<StoreInfoPage title="Talk with our team" description="For product questions, delivery coverage and timelines, accepted payment methods, or return and exchange terms, send a request and the store will confirm details before you decide." />} />
        <Route path="about" element={<StoreInfoPage title="Made with care in Quetta" description="Explore the collection, review product and pricing details, or share an idea for a custom design." />} />
        <Route path="gold" element={<Navigate to="/shop" replace />} />
        <Route path="bridal" element={<Navigate to="/shop" replace />} />
        <Route path="bullion" element={<Navigate to="/shop" replace />} />
        <Route path="collections" element={<Navigate to="/shop" replace />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />

      {/* Every page inside here gets the sidebar + header and is protected by the layout */}
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<AdminDashboardPage />} />
        <Route path="orders" element={<AdminOrdersPage />} />
        <Route path="orders/:orderId" element={<OrderDetailPage />} />
        <Route path="products" element={<ProductsPage />} />
        <Route path="products/new" element={<ProductFormPage />} />
        <Route path="products/:productId/edit" element={<ProductFormPage />} />
        <Route path="inventory" element={<InventoryPage />} />
        <Route path="metal-rates" element={<MetalRatesPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="settings" element={<StoreSettingsPage />} />
        <Route path="custom-requests" element={<CustomRequestsPage />} />
        <Route path="custom-requests/:requestId" element={<CustomRequestDetailPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path="*" element={<ComingSoon title="Page not found" />} />
    </Routes>
    </Suspense>
  );
}
