import api from "./api";

export interface Product {
  _id: string;
  name: string;
  productCode: string;
  price: number;
  offerPrice?: number;
  basePrice?: number;
  profitMarginPrice?: number;
  images: Array<{
    url: string;
    publicId: string;
  }>;
}

export interface CategoryWithProducts {
  _id: string;
  name: string;
  products: Product[];
}

export interface ProductOrder {
  productId: string;
  serialNumber: number;
}

export interface CategoryOrder {
  categoryId: string;
  serialNumber: number;
  products: ProductOrder[];
}

// For populated responses from the API
export interface PopulatedProductOrder {
  productId:
    | string
    | {
        _id: string;
        name: string;
        productCode: string;
        price: number;
        offerPrice?: number;
        images: Array<{ url: string; publicId: string }>;
      };
  serialNumber: number;
}

export interface PopulatedCategoryOrder {
  categoryId: string | { _id: string; name: string };
  serialNumber: number;
  products: PopulatedProductOrder[];
  _id: string;
}

export interface QuickShoppingOrder {
  categoryOrder: CategoryOrder[];
}

// Get categories with all products
export const getCategoriesWithProducts = async (): Promise<
  CategoryWithProducts[]
> => {
  const response = await api.get("/quick-shopping/categories-with-products");
  return response.data.data;
};

// Get saved quick shopping order
export const getQuickShoppingOrder = async (): Promise<
  PopulatedCategoryOrder[] | null
> => {
  try {
    const response = await api.get("/quick-shopping/order");
    console.log("API Response for getQuickShoppingOrder:", response.data);
    return response.data.data;
  } catch (error) {
    console.error("Error fetching quick shopping order:", error);
    return null;
  }
};

// Save quick shopping order
export const saveQuickShoppingOrder = async (
  categoryOrder: CategoryOrder[]
): Promise<void> => {
  console.log("API: Saving quick shopping order", categoryOrder);
  const response = await api.post("/quick-shopping/order", { categoryOrder });
  console.log("API: Save response", response.data);
  return response.data;
};

// Reset quick shopping order
export const resetQuickShoppingOrder = async (): Promise<void> => {
  await api.delete("/quick-shopping/order");
};
