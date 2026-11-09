import { Outlet, useLocation } from 'react-router';
import Header from './Header.jsx';
import SiteFooter from '../../../components/SiteFooter.jsx';
import { CartProvider } from '../../cart/CartContext.jsx';

export default function StorefrontLayout() {
  const { pathname } = useLocation();
  const isHome = pathname === '/';
  return (
    <CartProvider><div className="min-h-screen bg-[#fbfaf8] text-stone-900">
      <Header />
      <div className={isHome ? '' : 'pt-28'}><Outlet /></div>
      <SiteFooter />
    </div></CartProvider>
  );
}
