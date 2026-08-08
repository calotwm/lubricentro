import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { getToken } from "../auth/tokenStore";

// ── Dashboard ────────────────────────────────────────────────────────────────

export interface PriceChangeItem {
  id: number;
  product_name: string;
  old_price: string;
  new_price: string;
  percentage: string | null;
  source: string;
  created_at: string | null;
}

export interface RecentQuote {
  id: number;
  quote_number: string;
  client_name: string;
  total: string;
  status: string;
  created_at: string | null;
}

export interface DashboardData {
  total_products: number;
  total_brands: number;
  recent_price_changes: PriceChangeItem[];
  recent_quotes: RecentQuote[];
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: () => api.get<DashboardData>("/reports/dashboard"),
  });
}

// ── Price History ────────────────────────────────────────────────────────────

export interface PriceHistoryItem {
  id: number;
  product_name: string;
  brand_name: string | null;
  old_price: string;
  new_price: string;
  percentage: string | null;
  source: string;
  reference: string | null;
  created_at: string | null;
}

export interface PriceHistoryResponse {
  items: PriceHistoryItem[];
  total: number;
}

export interface PriceHistoryFilters {
  product_id?: number | null;
  brand_id?: number | null;
  date_from?: string | null;
  date_to?: string | null;
  source?: string | null;
}

export function usePriceHistory(
  filters: PriceHistoryFilters = {},
  skip = 0,
  limit = 50,
) {
  const params = new URLSearchParams();
  if (filters.product_id) params.set("product_id", String(filters.product_id));
  if (filters.brand_id) params.set("brand_id", String(filters.brand_id));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.source) params.set("source", filters.source);
  params.set("skip", String(skip));
  params.set("limit", String(limit));

  return useQuery({
    queryKey: ["price-history", filters, skip, limit],
    queryFn: () =>
      api.get<PriceHistoryResponse>(`/reports/price-history?${params}`),
  });
}

export function getPriceHistoryCsvUrl(filters: PriceHistoryFilters = {}): string {
  const params = new URLSearchParams();
  if (filters.product_id) params.set("product_id", String(filters.product_id));
  if (filters.brand_id) params.set("brand_id", String(filters.brand_id));
  if (filters.date_from) params.set("date_from", filters.date_from);
  if (filters.date_to) params.set("date_to", filters.date_to);
  if (filters.source) params.set("source", filters.source);
  return `/api/reports/price-history/csv?${params}`;
}

export async function handleExportCsv(filters: PriceHistoryFilters = {}) {
  const today = new Date().toISOString().split("T")[0];
  const filename = `historial_precios_${today}.csv`;
  const url = getPriceHistoryCsvUrl(filters);
  const token = getToken();

  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(`Export failed with status ${res.status}`);

  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

// ── Bulk Price Update (unchanged) ────────────────────────────────────────────

export function useBulkPriceUpdate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      brand_id?: number | null;
      category_id?: number | null;
      percentage: string;
      note?: string | null;
    }) => api.put<{ updated: number; percentage: string }>("/prices/bulk", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["price-history"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
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
      const token = getToken();
      const res = await fetch("/api/prices/import-excel", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
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
      qc.invalidateQueries({ queryKey: ["price-history"] });
    },
  });
}
