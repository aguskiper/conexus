"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { CmsProduct } from "@/lib/cms/product-types";
import { productAmount } from "@/lib/cart/totals";
import { useCart } from "./CartProvider";
import { parseValidatedCart } from "@/lib/cart/validated";
export function useValidatedCart() {
  const { items, ready, setSettings, observePrice } = useCart();
  const [products, setProducts] = useState<Record<string, CmsProduct | null>>({});
  const [loading, setLoading] = useState(true), [error, setError] = useState(false), [changed, setChanged] = useState<string[]>([]);
  const currentItems = useRef(items), requestId = useRef(0);
  const slugs = items.map(item => item.slug).sort().join("|");
  useEffect(() => { currentItems.current = items; }, [items]);
  const refresh = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true); setError(false);
    try {
      const response = await fetch("/api/cart", { method: "POST", cache: "no-store", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items: currentItems.current }) });
      const body = await response.json();
      if (!response.ok) throw new Error("cart");
      const data = parseValidatedCart(body);
      if (id !== requestId.current) return null;
      const next: Record<string, CmsProduct | null> = {}, updates: string[] = [];
      for (const item of data.products) {
        next[item.slug] = item.product;
        if (item.product && observePrice(item.slug, item.product.currency + ":" + productAmount(item.product))) updates.push(item.slug);
      }
      setProducts(next); setSettings(data.settings); setChanged(previous => [...new Set([...previous, ...updates])]);
      return data;
    } catch { if (id === requestId.current) setError(true); return null; }
    finally { if (id === requestId.current) setLoading(false); }
  }, [setSettings, observePrice]);
  useEffect(() => {
    if (!ready) return;
    let active = true;
    const requests = requestId;
    queueMicrotask(() => { if (active) void refresh(); });
    const onFocus = () => { if (document.visibilityState === "visible") void refresh(); };
    document.addEventListener("visibilitychange", onFocus);
    return () => { active = false; requests.current++; document.removeEventListener("visibilitychange", onFocus); };
  }, [ready, slugs, refresh]);
  return { products, loading, error, changed, refresh };
}
