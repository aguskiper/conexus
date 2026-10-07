export function blogUrl(page = 1, category?: string): string {
  const query = new URLSearchParams();
  if (category) query.set("category", category);
  if (page > 1) query.set("page", String(page));
  return "/blog" + (query.size ? "?" + query.toString() : "");
}
export function publishedDate(date: string): string {
  return new Intl.DateTimeFormat("es-AR", { dateStyle: "long", timeZone: "America/Buenos_Aires" }).format(new Date(date));
}
