export function productsUrl({ page = 1, category, q }: { page?: number; category?: string; q?: string } = {}) {
  const params = new URLSearchParams();
  if (category) params.set("category", category);
  if (q) params.set("q", q);
  if (page > 1) params.set("page", String(page));
  return "/productos" + (params.size ? "?" + params.toString() : "");
}
