"use client";
import { useEffect, useState } from "react";
import type { PublicOrderStatus } from "@/lib/cms/payment-types";
import { mercadoPagoEnabled } from "@/lib/cms/payment-types";
import { getPaymentSession, type PaymentSession } from "@/lib/payment/session";
import { fetchOrderStatus } from "@/lib/payment/client";
import { PaymentError } from "@/lib/payment/errors";
import { pollPayment, POLL_TIMEOUT } from "@/lib/payment/poll";
import { settlePaidCart } from "@/lib/payment/cart";
import { useCart } from "@/components/cart/CartProvider";
export function usePaymentStatus(orderNumber?: string, override?: PaymentSession) {
  const cart = useCart();
  const [session, setSession] = useState<PaymentSession | null>(null), [ready, setReady] = useState(false);
  const [status, setStatus] = useState<PublicOrderStatus | null>(null), [error, setError] = useState("");
  const [timedOut, setTimedOut] = useState(false), [run, setRun] = useState(0), [cooldown, setCooldown] = useState(0);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (!active) return;
      const saved = orderNumber !== undefined ? getPaymentSession(orderNumber) : getPaymentSession();
      setSession(override && (orderNumber === undefined || override.orderNumber === orderNumber) ? override : saved);
      setReady(true);
    });
    return () => { active = false; };
  }, [orderNumber, override]);
  useEffect(() => {
    if (!ready || !session) return;
    const controller = new AbortController();
    const deadline = setTimeout(() => { controller.abort(); setTimedOut(true); }, POLL_TIMEOUT);
    void pollPayment({
      signal: controller.signal, visible: () => document.visibilityState !== "hidden",
      fetchStatus: () => fetchOrderStatus(session, controller.signal),
      onStatus: value => { setStatus(value); setError(""); },
      onError: value => { setError(value.code); if (value.retryAfter) setCooldown(Date.now() + value.retryAfter * 1000); },
      onTimeout: () => setTimedOut(true),
    }).finally(() => clearTimeout(deadline));
    return () => { clearTimeout(deadline); controller.abort(); };
  }, [ready, session, run]);
  useEffect(() => {
    if (!cooldown) return;
    const timer = setTimeout(() => setCooldown(0), Math.max(0, cooldown - Date.now()));
    return () => clearTimeout(timer);
  }, [cooldown]);
  useEffect(() => {
    if (status && session) settlePaidCart(status, session, cart);
  }, [status, session, cart]);
  function refresh() {
    if (cooldown > Date.now()) return;
    setTimedOut(false); setError(""); setRun(value => value + 1);
  }
  function failure(value: unknown) {
    const safe = value instanceof PaymentError ? value : new PaymentError("CMS_UNAVAILABLE");
    setError(safe.code);
    if (safe.retryAfter) setCooldown(Date.now() + safe.retryAfter * 1000);
  }
  return { ready, session, status, error, timedOut, cooldown, refresh, setStatus, failure, paymentsEnabled: mercadoPagoEnabled(cart.settings) };
}
