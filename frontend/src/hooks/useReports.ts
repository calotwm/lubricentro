import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import type { Product } from "./useProducts";

export interface DashboardData {
  total_inventory_value: string;
  low_stock_count: number;
  today_sales_total: string;
  month_sales_total: string;
  low_stock_products: Product[];
}

export interface BestSellerItem {
  product_id: number;
  product_name: string;
  total_quantity_sold: number;
  total_revenue: string;
}

export interface ProfitMarginData {
  total_revenue: string;
  total_cost: string;
  gross_profit: string;
  margin_percentage: string;
}

export interface StockMovementCsvRow {
  id: number;
  product_id: number;
  product_name: string;
  type: string;
  quantity: number;
  reference: string | null;
  notes: string | null;
  created_at: string | null;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/reports/dashboard"),
  });
}

export function useBestSellers(limit = 10) {
  return useQuery({
    queryKey: ["best-sellers", limit],
    queryFn: () => api.get<BestSellerItem[]>(`/reports/best-sellers?limit=${limit}`),
  });
}

export function useProfitMargin() {
  return useQuery({
    queryKey: ["profit-margin"],
    queryFn: () => api.get<ProfitMarginData>("/reports/profit-margin"),
  });
}

export function useReorderList() {
  return useQuery({
    queryKey: ["reorder-list"],
    queryFn: () => api.get<Product[]>("/reports/reorder-list"),
  });
}

export function useStockHistoryCsv() {
  return useQuery({
    queryKey: ["stock-history-csv"],
    queryFn: () => api.get<StockMovementCsvRow[]>("/reports/stock-history"),
  });
}

export function useBulkPriceUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      brand_id?: number | null;
      category_id?: number | null;
      percentage: string;
    }) => api.put<{ updated: number; percentage: string }>("/prices/bulk", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}

export interface ExcelImportResult {
  updated: number;
  created: number;
  skipped: number;
  errors: string[];
}

export function useImportExcel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File): Promise<ExcelImportResult> => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/prices/import-excel", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const msg = (body as { detail?: string }).detail ?? `Error ${res.status}`;
        throw new Error(msg);
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
    },
  });
}
