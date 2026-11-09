import { createContext, useCallback, useContext, useMemo, useState } from 'react';

const STORAGE_KEY = 'zareen-cart-v1';
const CartContext = createContext(null);

function readCart() {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter((item) => item?.variantId && Number.isInteger(item.quantity) && item.quantity > 0) : [];
  } catch { return []; }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);
  const persist = useCallback((update) => {
    setItems((current) => {
      const next = typeof update === 'function' ? update(current) : update;
      try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* storage is optional */ }
      return next;
    });
  }, []);

  const addItem = useCallback((product, variant, quantity = 1) => {
    if (!variant?.id) return;
    persist((current) => {
      const found = current.find((item) => String(item.variantId) === String(variant.id));
      if (found) return current.map((item) => String(item.variantId) === String(variant.id) ? { ...item, quantity: Math.min(20, item.quantity + quantity), ...snapshot(product, variant) } : item);
      return [...current, { ...snapshot(product, variant), variantId: String(variant.id), quantity: Math.min(20, Math.max(1, quantity)) }];
    });
  }, [persist]);

  const setQuantity = useCallback((variantId, quantity) => {
    const nextQuantity = Math.max(1, Math.min(20, Number(quantity) || 1));
    persist((current) => current.map((item) => String(item.variantId) === String(variantId) ? { ...item, quantity: nextQuantity } : item));
  }, [persist]);
  const removeItem = useCallback((variantId) => persist((current) => current.filter((item) => String(item.variantId) !== String(variantId))), [persist]);
  const clearCart = useCallback(() => persist([]), [persist]);

  const value = useMemo(() => ({ items, addItem, setQuantity, removeItem, clearCart, itemCount: items.reduce((sum, item) => sum + item.quantity, 0) }), [items, addItem, setQuantity, removeItem, clearCart]);
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

function snapshot(product, variant) {
  return {
    productId: String(product.id), productSlug: product.slug, productName: product.name,
    image: product.images?.[0]?.url || '', optionLabel: variant.optionLabel || '', sku: variant.sku || '',
    metalType: product.metalType || '', purity: product.purity || '', weightGrams: variant.weightGrams ?? null,
    pricingMode: variant.pricingMode, unitPrice: Number(variant.fixedPrice) || 0,
    ratePerGram: variant.ratePerGram ?? null, makingChargeType: variant.makingChargeType,
    makingCharge: variant.makingCharge ?? 0,
  };
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider.');
  return context;
}
