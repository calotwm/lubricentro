import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";

export interface StockMovement {
  id: number;
  product_id: number;
  type: "ENTRY" | "EXIT" | "ADJUSTMENT";
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string;
}

export interface MovementCreatePayload {
  product_id: number;
  type: "ENTRY" | "EXIT" | "ADJUSTMENT";
  quantity: number;
  reference?: string | null;
  notes?: string | null;
}

export interface ReceivePayload {
  product_id: number;
  quantity: number;
  cost_price?: string | null;
  reference?: string | null;
  notes?: string | null;
}

export function useStockMovements(
  productId?: number | null,
  type?: string | null,
  skip = 0,
  limit = 50,
) {
  const params = new URLSearchParams();
  if (productId) params.set("product_id", String(productId));
  if (type) params.set("type", type);
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  return useQuery({
    queryKey: ["stock-movements", productId, type, skip, limit],
    queryFn: () => api.get<StockMovement[]>(`/stock/movements?${params}`),
  });
}

export function useCreateMovement() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: MovementCreatePayload) =>
      api.post<StockMovement>("/stock/movements", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}

export function useReceiveStock() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ReceivePayload) =>
      api.post<StockMovement>("/stock/receive", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["stock-movements"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });
}
