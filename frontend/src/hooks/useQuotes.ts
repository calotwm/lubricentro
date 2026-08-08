import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/client";
import { getToken } from "../auth/tokenStore";

// ── Types ────────────────────────────────────────────────────────────────────

export interface QuoteItem {
  id: number;
  quote_id: number;
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Quote {
  id: number;
  quote_number: string;
  client_name: string;
  client_phone: string | null;
  status: string;
  total: string;
  created_at: string;
  items: QuoteItem[];
}

export interface QuoteListItem {
  id: number;
  quote_number: string;
  client_name: string;
  total: string;
  status: string;
  created_at: string;
}

export interface QuoteListResponse {
  items: QuoteListItem[];
  total: number;
  page: number;
  page_size: number;
}

export interface QuoteItemPayload {
  product_id?: number | null;
  description: string;
  quantity: number;
  unit_price: string;
}

export interface QuoteCreatePayload {
  client_name: string;
  client_phone?: string | null;
  items: QuoteItemPayload[];
}

export type QuoteUpdatePayload = QuoteCreatePayload;

// ── Query hooks ──────────────────────────────────────────────────────────────

export function useQuotes(skip = 0, limit = 20) {
  return useQuery({
    queryKey: ["quotes", skip, limit],
    queryFn: () => api.get<QuoteListResponse>(`/quotes?skip=${skip}&limit=${limit}`),
  });
}

export function useQuote(id: number | null) {
  return useQuery({
    queryKey: ["quotes", id],
    queryFn: () => api.get<Quote>(`/quotes/${id}`),
    enabled: id !== null,
  });
}

// ── Mutation hooks ───────────────────────────────────────────────────────────

export function useCreateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: QuoteCreatePayload) => api.post<Quote>("/quotes", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useUpdateQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: QuoteUpdatePayload }) =>
      api.put<Quote>(`/quotes/${id}`, data),
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
      qc.invalidateQueries({ queryKey: ["quotes", variables.id] });
    },
  });
}

export function useDeleteQuote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete<void>(`/quotes/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["quotes"] });
    },
  });
}

export function useQuotePdf(quoteId: number) {
  return useQuery({
    queryKey: ["quote-pdf", quoteId],
    queryFn: async () => {
      const token = getToken();
      const res = await fetch(`/api/quotes/${quoteId}/pdf`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(`Error ${res.status}`);
      return res.blob();
    },
    enabled: false, // Only fetch on demand
  });
}
