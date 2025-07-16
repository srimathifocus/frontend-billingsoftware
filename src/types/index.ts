export interface User {
  id: string;
  email: string;
  branch?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface Category {
  _id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export interface Subcategory {
  _id: string;
  name: string;
  categoryId:
    | string
    | {
        _id: string;
        name: string;
      };
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  _id?: string;
  url: string;
  publicId: string;
}

export interface Product {
  _id: string;
  productCode: string;
  name: string;
  description: string;
  price: number;
  offerPrice?: number;
  categoryId:
    | string
    | {
        _id: string;
        name: string;
      };
  subcategoryId?:
    | string
    | {
        _id: string;
        name: string;
      };
  inStock: boolean;
  bestSeller: boolean;
  tags: string[];
  images: ProductImage[];
  createdAt: string;
  updatedAt: string;
  // New fields
  isActive?: boolean;
  youtubeLink?: string;
  stockQuantity?: number;
  // Computed fields from API
  savings?: number;
  savingsPercentage?: number;
  finalPrice?: number;
  imageCount?: number;
  tagCount?: number;
}

export interface Banner {
  _id: string;
  imageUrl: string;
  type: "landscape" | "portrait";
  createdAt: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalProducts: number;
  bestSellers: number;
  outOfStock: number;
  inStock: number;
  productsWithOffer: number;
  productsOriginalPrice: number;
  activeProducts?: number;
  inactiveProducts?: number;
  totalStock?: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CategoryCount {
  _id: string;
  categoryId: string;
  categoryName: string;
  totalProducts: number;
  directProducts: number;
  subcategoryProducts: number;
}

export interface SubcategoryCount {
  _id: string;
  subcategoryId: string;
  subcategoryName: string;
  categoryId: string;
  categoryName: string;
  productCount: number;
}

export interface CategoryStats {
  totalProducts: number;
  categoryCounts: CategoryCount[];
  subcategoryCounts: SubcategoryCount[];
}

export interface ProductCodeCheckResponse {
  productCode: string;
  isAvailable: boolean;
  message: string;
}
