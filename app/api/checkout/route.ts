import { getCheckoutSettings, logCmsError } from "@/lib/cms/client";
import { noStoreHeaders } from "@/lib/cart/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try { return Response.json({ data: await getCheckoutSettings() }, { headers: noStoreHeaders }); }
  catch (error) { logCmsError("configuración de checkout", error); return Response.json({ error: { code: "CMS_UNAVAILABLE" } }, { status: 503, headers: noStoreHeaders }); }
}
