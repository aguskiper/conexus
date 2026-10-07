export interface CmsCategory { name: string; slug: string; postCount?: number }
export interface CmsPost {
  title: string; slug: string; excerpt: string; featuredImage: string | null;
  featuredImageAlt: string | null; category: CmsCategory | null; publishedAt: string; updatedAt: string;
}
export interface CmsPostDetail extends CmsPost {
  content: unknown; seo: { title: string | null; description: string | null };
}
export interface CmsPosts { data: CmsPost[]; pagination: { page: number; limit: number; total: number; totalPages: number } }
export class CmsError extends Error {
  constructor(public readonly kind: "configuration" | "network" | "response" | "contract", public readonly status?: number) {
    super("CMS request failed"); this.name = "CmsError";
  }
}
