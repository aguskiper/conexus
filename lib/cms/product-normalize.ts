import { CmsError } from "./types";
import { parseCategory, record } from "./normalize";
import { safePublicUrl } from "./urls";
import type { CmsProduct, CmsProductDetail, CmsProducts } from "./product-types";
const text = (value: unknown) => typeof value === "string" ? value : "";
const decimal = (value: unknown) => typeof value === "string" && /^\d+(?:\.\d+)?$/.test(value) ? value : null;
export function parseProduct(value: unknown, visible = true): CmsProduct {
  const data = record(value);
  if (data.status !== undefined && data.status !== "PUBLISHED") throw new CmsError("contract");
  if (!text(data.name) || !text(data.slug) || !Number.isFinite(Date.parse(text(data.publishedAt)))) throw new CmsError("contract");
  const stock = record(data.stock);
  if (typeof stock.managed !== "boolean" || typeof stock.available !== "boolean") throw new CmsError("contract");
  const showPrices = visible && data.showPrices !== false;
  return { name: text(data.name), slug: text(data.slug), shortDescription: text(data.shortDescription),
    price: showPrices ? decimal(data.price) : null, salePrice: showPrices ? decimal(data.salePrice) : null,
    currency: text(data.currency), showPrices,
    stock: { managed: stock.managed, available: !stock.managed || stock.available,
      ...(Number.isSafeInteger(stock.availableQuantity) && Number(stock.availableQuantity) >= 0 ? { availableQuantity: Number(stock.availableQuantity) } : {}) },
    featuredImage: safePublicUrl(data.featuredImage), featuredImageAlt: text(data.featuredImageAlt) || null,
    category: data.category ? parseCategory(data.category) : null,
    publishedAt: text(data.publishedAt), updatedAt: text(data.updatedAt) || text(data.publishedAt) };
}
export function parseProducts(value: unknown): CmsProducts {
  const payload = record(value), pagination = record(payload.pagination);
  if (!Array.isArray(payload.data)) throw new CmsError("contract");
  for (const key of ["page", "limit", "total", "totalPages"]) {
    if (!Number.isSafeInteger(pagination[key]) || Number(pagination[key]) < (key === "page" || key === "limit" ? 1 : 0)) throw new CmsError("contract");
  }
  return { data: payload.data.map(item => parseProduct(item, payload.showPrices !== false)), pagination: { page: Number(pagination.page), limit: Number(pagination.limit), total: Number(pagination.total), totalPages: Number(pagination.totalPages) } };
}
export function parseProductDetail(value: unknown): CmsProductDetail {
  const payload = record(value), data = record(payload.data);
  const seo = data.seo ? record(data.seo) : {};
  return { ...parseProduct(data, payload.showPrices !== false), description: data.description,
    gallery: Array.isArray(data.gallery) ? data.gallery.map(safePublicUrl).filter((url): url is string => Boolean(url)) : [],
    seo: { title: text(seo.title) || null, description: text(seo.description) || null } };
}
export function parseProductCategories(value: unknown) {
  const payload = record(value);
  if (!Array.isArray(payload.data)) throw new CmsError("contract");
  return payload.data.map(parseCategory);
}
