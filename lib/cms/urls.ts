export function safePublicUrl(value: unknown): string | null {
  if (typeof value !== "string" || /[\u0000-\u0020\u007f]/.test(value)) return null;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : null;
  } catch { return null; }
}
export function safeLinkHref(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const href = value.trim();
  if (!href || /[\u0000-\u0020\u007f\\]/.test(href)) return null;
  if (href.startsWith("//")) return null;
  if (/^(\/|#|\?)/.test(href)) return href;
  if (/^(mailto:|tel:)/i.test(href)) return href;
  return safePublicUrl(href);
}
function isLocal(host: string) {
  return ["localhost", "127.0.0.1", "[::1]", "0.0.0.0"].includes(host) || host.endsWith(".localhost");
}
export function metadataImage(value: string | null): string | undefined {
  const safe = safePublicUrl(value);
  if (!safe || (process.env.NODE_ENV === "production" && isLocal(new URL(safe).hostname))) return undefined;
  return safe;
}
export function productionCanonical(path: string): string | undefined {
  const origin = safePublicUrl(process.env.CONEXUS_SITE_URL);
  if (!origin) return undefined;
  const url = new URL(origin);
  if (url.protocol !== "https:" || isLocal(url.hostname)) return undefined;
  return new URL(path, url.origin).href;
}
