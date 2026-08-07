import type { QuoteItem } from "../hooks/useQuotes";

/**
 * Build a WhatsApp click-to-chat URL for a quote.
 * Returns null when the quote has no client_phone (caller should disable the button).
 */
export function buildWhatsAppLink(
  quote: { quote_number: string; created_at: string; client_name: string; client_phone: string | null; total: string },
  items: QuoteItem[],
): string | null {
  if (!quote.client_phone) return null;

  // Strip non-digit characters (spaces, dashes, parens, leading +)
  const digits = quote.client_phone.replace(/\D/g, "");
  if (!digits) return null;

  const message = formatQuoteMessage(quote, items);
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

// ── Internal helpers ─────────────────────────────────────────────────────────

function formatMoney(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
}

function formatWhatsAppDate(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatQuoteMessage(
  quote: { quote_number: string; created_at: string; client_name: string; total: string },
  items: QuoteItem[],
): string {
  const lines: string[] = [];
  lines.push(`*LUBRICENTRO G&G* — Presupuesto ${quote.quote_number}`);
  lines.push(`Fecha: ${formatWhatsAppDate(quote.created_at)}`);
  lines.push(`Cliente: ${quote.client_name}`);
  lines.push("-------------------------");

  for (const item of items) {
    const qty = item.quantity;
    const unitPrice = parseFloat(item.unit_price) || 0;
    const subtotal = qty * unitPrice;
    lines.push(
      `\u00B7 ${qty}x ${item.description}: $${formatMoney(unitPrice)} c/u = $${formatMoney(subtotal)}`,
    );
  }

  lines.push("-------------------------");
  lines.push(`TOTAL: $${formatMoney(quote.total)}`);

  return lines.join("\n");
}
