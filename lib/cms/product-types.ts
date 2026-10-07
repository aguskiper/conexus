import type { CmsCategory, CmsPosts } from "./types";
export interface CmsProduct {
  name: string; slug: string; shortDescription: string;
  price: string | null; salePrice: string | null; currency: string; showPrices: boolean;
  stock: { managed: boolean; available: boolean };
  featuredImage: string | null; featuredImageAlt: string | null;
  category: CmsCategory | null; publishedAt: string; updatedAt: string;
}
export interface CmsProductDetail extends CmsProduct {
  description: unknown; gallery: string[]; seo: { title: string | null; description: string | null };
}
export interface CmsProducts { data: CmsProduct[]; pagination: CmsPosts["pagination"] }
