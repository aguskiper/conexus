"use client";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { CART_KEY, MAX_ITEMS, addCartItem, readCart, setCartQuantity, type CartItem } from "@/lib/cart/model";
import type { CheckoutSettings, OrderReceipt } from "@/lib/cms/checkout-types";
import { parseCheckoutSettings } from "@/lib/cms/checkout-normalize";
type CartContextValue = {
  items: CartItem[]; ready: boolean; totalItems: number; settings: CheckoutSettings | null; storageWarning: boolean;
  addItem: (slug: string, quantity: number) => boolean; removeItem: (slug: string) => void;
  updateQuantity: (slug: string, quantity: number) => void; clearCart: () => void;
  setSettings: (value: CheckoutSettings | null) => void;
  observePrice: (slug: string, price: string | null) => boolean;
  receipt: OrderReceipt | null; setReceipt: (receipt: OrderReceipt) => void;
};
const CartContext = createContext<CartContextValue | null>(null);
export const RECEIPT_KEY = "conexus-last-order-v1";
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]), [ready, setReady] = useState(false);
  const [settings, setSettings] = useState<CheckoutSettings | null>(null), [storageWarning, setStorageWarning] = useState(false);
  const [receipt, saveReceipt] = useState<OrderReceipt | null>(null);
  const prices = useRef(new Map<string, string | null>());
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try { setItems(readCart(localStorage.getItem(CART_KEY))); } catch { setStorageWarning(true); }
      setReady(true);
    });
    const sync = (event: StorageEvent) => { if (event.key === CART_KEY) setItems(readCart(event.newValue)); };
    window.addEventListener("storage", sync);
    const refresh = async () => {
      if (document.visibilityState === "hidden") return;
      try { const response = await fetch("/api/checkout", { cache: "no-store" }); const payload = await response.json(); if (active && response.ok) setSettings(parseCheckoutSettings(payload)); }
      catch { /* Una falla no transforma el catálogo en un error. */ }
    };
    void refresh();
    document.addEventListener("visibilitychange", refresh);
    return () => { active = false; window.removeEventListener("storage", sync); document.removeEventListener("visibilitychange", refresh); };
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
    catch { queueMicrotask(() => setStorageWarning(true)); }
  }, [items, ready]);
  const addItem = useCallback((slug: string, amount: number) => {
    if (!ready || (!items.some(item => item.slug === slug) && items.length >= MAX_ITEMS)) return false;
    setItems(previous => addCartItem(previous, slug, amount)); return true;
  }, [items, ready]);
  const observePrice = useCallback((slug: string, price: string | null) => {
    const changed = prices.current.has(slug) && prices.current.get(slug) !== price;
    prices.current.set(slug, price); return changed;
  }, []);
  const setReceipt = useCallback((value: OrderReceipt) => {
    saveReceipt(value);
    try { sessionStorage.setItem(RECEIPT_KEY, JSON.stringify(value)); } catch { /* El contexto sigue conservando el comprobante público. */ }
  }, []);
  return <CartContext.Provider value={{ items, ready, totalItems: items.reduce((total, item) => total + item.quantity, 0), settings, storageWarning, addItem,
    removeItem: slug => setItems(previous => previous.filter(item => item.slug !== slug)),
    updateQuantity: (slug, amount) => setItems(previous => setCartQuantity(previous, slug, amount)),
    clearCart: () => setItems([]), setSettings, observePrice, receipt, setReceipt }}>{children}</CartContext.Provider>;
}
export function useCart() { const context = useContext(CartContext); if (!context) throw new Error("CartProvider missing"); return context; }
