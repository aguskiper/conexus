import { CmsError, type CmsCategory, type CmsPost, type CmsPostDetail, type CmsPosts } from "./types";
import { safePublicUrl } from "./urls";

export function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new CmsError("contract");
  return value as Record<string, unknown>;
}
const text = (value: unknown) => typeof value === "string" ? value : "";
export function parseCategory(value: unknown): CmsCategory {
  const data = record(value);
  if (!text(data.name) || !text(data.slug)) throw new CmsError("contract");
  return { name: text(data.name), slug: text(data.slug), ...(typeof data.postCount === "number" ? { postCount: data.postCount } : {}) };
}
export function parsePost(value: unknown): CmsPost {
  const data = record(value);
  // La API pública omite status; si lo incluye, nunca aceptar borradores.
  if (data.status !== undefined && data.status !== "PUBLISHED") throw new CmsError("contract");
  if (!text(data.title) || !text(data.slug) || !text(data.publishedAt) || !Number.isFinite(Date.parse(text(data.publishedAt)))) throw new CmsError("contract");
  return { title: text(data.title), slug: text(data.slug), excerpt: text(data.excerpt),
    featuredImage: safePublicUrl(data.featuredImage), featuredImageAlt: text(data.featuredImageAlt) || null,
    category: data.category ? parseCategory(data.category) : null,
    publishedAt: text(data.publishedAt), updatedAt: text(data.updatedAt) || text(data.publishedAt) };
}
export function parsePosts(value: unknown): CmsPosts {
  const payload = record(value), pagination = record(payload.pagination);
  if (!Array.isArray(payload.data)) throw new CmsError("contract");
  for (const key of ["page", "limit", "total", "totalPages"]) {
    if (!Number.isSafeInteger(pagination[key]) || Number(pagination[key]) < (key === "page" || key === "limit" ? 1 : 0)) throw new CmsError("contract");
  }
  return { data: payload.data.map(parsePost), pagination: { page: Number(pagination.page), limit: Number(pagination.limit), total: Number(pagination.total), totalPages: Number(pagination.totalPages) } };
}
export function parsePostDetail(value: unknown): CmsPostDetail {
  const data = record(record(value).data);
  const seo = data.seo && typeof data.seo === "object" ? record(data.seo) : {};
  return { ...parsePost(data), content: data.content, seo: { title: text(seo.title) || null, description: text(seo.description) || null } };
}
export function parseCategories(value: unknown): CmsCategory[] {
  const payload = record(value);
  if (!Array.isArray(payload.data)) throw new CmsError("contract");
  return payload.data.map(parseCategory);
}
