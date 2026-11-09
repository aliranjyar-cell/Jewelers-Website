import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router';
import { getPublicStoreName, updateAdminStoreName } from '../lib/api.js';

export const DEFAULT_STORE_NAME = 'Zareen Jewellers';
const StoreBrandContext = createContext(null);

export function StoreBrandProvider({ children }) {
  const [storeName, setStoreName] = useState(DEFAULT_STORE_NAME);
  const { pathname } = useLocation();

  useEffect(() => {
    let active = true;
    getPublicStoreName().then((name) => {
      if (active && typeof name === 'string' && name.trim()) setStoreName(name.trim());
    }).catch(() => {});
    return () => { active = false; };
  }, []);

  useEffect(() => {
    document.title = `${storeName} | Jewellery`; 
    const socialTitle = document.querySelector('meta[property="og:title"]');
    if (socialTitle) socialTitle.setAttribute('content', `${storeName} | Jewellery from Quetta`);
  }, [storeName, pathname]);

  async function saveStoreName(value) {
    const saved = await updateAdminStoreName(value);
    setStoreName(saved);
    return saved;
  }

  return <StoreBrandContext.Provider value={{ storeName, saveStoreName }}>{children}</StoreBrandContext.Provider>;
}

export function useStoreBrand() {
  return useContext(StoreBrandContext) || { storeName: DEFAULT_STORE_NAME, saveStoreName: async () => DEFAULT_STORE_NAME };
}
