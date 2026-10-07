import { CheckoutError } from "@/lib/cms/checkout-types";

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true; // Clientes server-to-server y pruebas de terminal.
  try { return new URL(origin).host === (request.headers.get("host") || new URL(request.url).host); } catch { return false; }
}
export const noStoreHeaders = { "Cache-Control": "no-store" };

export async function readJsonLimited(request: Request, limit: number): Promise<unknown> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json") || !request.body) throw new CheckoutError("INVALID_CHECKOUT", 400);
  const reader = request.body.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > limit) { await reader.cancel(); throw new CheckoutError("INVALID_CHECKOUT", 400); }
      chunks.push(value);
    }
    const data = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { data.set(chunk, offset); offset += chunk.byteLength; }
    return JSON.parse(new TextDecoder().decode(data));
  } catch { throw new CheckoutError("INVALID_CHECKOUT", 400); }
  finally { reader.releaseLock(); }
}
