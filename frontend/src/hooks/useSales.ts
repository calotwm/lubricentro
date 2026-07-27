import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Sale {
  id: number;
  total: string;
  payment_method: string;
  notes: string | null;
  created_at: string;
  items: SaleItem[];
}

export interface SaleItemPayload {
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface SaleCreatePayload {
  items: SaleItemPayload[];
  payment_method: string;
  notes?: string | null;
}

export function useSales(skip = 0, limit = 50) {
  const params = new URLSearchParams();
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  return useQuery({
    queryKey: ["sales", skip, limit],
    queryFn: () => api.get<Sale[]>(`/sales?${params}`),
  });
}

export function useSale(id: number | null) {
  return useQuery({
    queryKey: ["sales", id],
    queryFn: () => api.get<Sale>(`/sales/${id}`),
    enabled: id !== null,
  });
}

export function useCreateSale() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SaleCreatePayload) => api.post<Sale>("/sales", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["sales"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
