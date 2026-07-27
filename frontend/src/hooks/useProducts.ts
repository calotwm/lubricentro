import {
  useQuery,
  useMutation,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import { api } from "../api/client";

// ── Types ────────────────────────────────────────────────────────────────────

export interface Category {
  id: number;
  name: string;
  created_at: string;
}

export interface Brand {
  id: number;
  name: string;
  created_at: string;
}

export interface Product {
  id: number;
  sku: string | null;
  name: string;
  category_id: number | null;
  brand_id: number | null;
  specification: string | null;
  unit: string;
  cost_price: string | null;
  selling_price: string | null;
  current_stock: number;
  min_stock: number;
  is_active: boolean;
  created_at: string;
  updated_at: string | null;
  category: Category | null;
  brand: Brand | null;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  page: number;
  page_size: number;
}

export interface ProductCreatePayload {
  name: string;
  sku?: string | null;
  category_id?: number | null;
  brand_id?: number | null;
  specification?: string | null;
  unit?: string;
  cost_price?: string | null;
  selling_price?: string | null;
  current_stock?: number;
  min_stock?: number;
}

export type ProductUpdatePayload = Partial<ProductCreatePayload>;

// ── Query hooks ──────────────────────────────────────────────────────────────

export function useProducts(
  search?: string,
  categoryId?: number | null,
  brandId?: number | null,
  page = 1,
  pageSize = 50,
) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (categoryId) params.set("category_id", String(categoryId));
  if (brandId) params.set("brand_id", String(brandId));
  params.set("skip", String((page - 1) * pageSize));
  params.set("limit", String(pageSize));

  return useQuery({
    queryKey: ["products", search, categoryId, brandId, page, pageSize],
    queryFn: () => api.get<ProductListResponse>(`/products?${params}`),
    placeholderData: keepPreviousData,
  });
}

export function useProduct(id: number | null) {
  return useQuery({
    queryKey: ["products", id],
    queryFn: () => api.get<Product>(`/products/${id}`),
    enabled: id !== null,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api.get<Category[]>("/categories"),
  });
}

export function useBrands() {
  return useQuery({
    queryKey: ["brands"],
    queryFn: () => api.get<Brand[]>("/brands"),
  });
}

// ── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ProductCreatePayload) => api.post<Product>("/products", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: ProductUpdatePayload }) =>
      api.put<Product>(`/products/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/products/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
