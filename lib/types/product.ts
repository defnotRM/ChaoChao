export type ProductStatus = "available" | "rented" | "maintenance" | "inactive";

export interface Product {
  id: string;
  title: string;
  categoryId: string;
  categorySlug?: string;
  categoryIcon?: string;
  imageSeeds: string[];
  description: string;
  pricePerDay: number;
  deposit: number;
  rating: number;
  reviewCount: number;
  location: string;
  ownerId: string;
  ownerName?: string;
  ownerVerified?: boolean;
  status: ProductStatus;
  availableFrom: string;
  condition: string;
  terms: string[];
}
