import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useQuotes, useQuote, useDeleteQuote } from "../../hooks/useQuotes";
import AlertBanner from "../../components/ui/AlertBanner";
import { buildWhatsAppLink } from "../../utils/whatsapp";

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(parseFloat(value));
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default function QuotesListPage() {
  const { data, isLoading, error } = useQuotes();
  const deleteQuote = useDeleteQuote();
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // WhatsApp: fetch quote detail on demand
  const [whatsappQuoteId, setWhatsappQuoteId] = useState<number | null>(null);
  const waWindowRef = useRef<Window | null>(null);
  const { data: whatsappQuote, isSuccess, isFetching: isWaLoading, isError: isWaError } = useQuote(whatsappQuoteId);

  useEffect(() => {
    if (isSuccess && whatsappQuote && whatsappQuote.id === whatsappQuoteId) {
      const link = buildWhatsAppLink(whatsappQuote, whatsappQuote.items);
      if (link && waWindowRef.current) {
        // Point the tab opened during the click gesture to the final URL.
        waWindowRef.current.location.href = link;
      } else if (waWindowRef.current) {
        // No client phone on the quote — close the placeholder tab.
        waWindowRef.current.close();
      }
      waWindowRef.current = null;
      setWhatsappQuoteId(null);
    }
  }, [isSuccess, whatsappQuote, whatsappQuoteId]);

  const handleWhatsApp = (quoteId: number) => {
    // Open the tab synchronously in the click gesture so popup blockers allow it.
    waWindowRef.current = window.open("", "_blank");
    setWhatsappQuoteId(quoteId);
  };

  const handleDelete = (quoteId: number, quoteNumber: string) => {
    if (window.confirm(`¿Eliminar el presupuesto ${quoteNumber}?`)) {
      setDeleteError(null);
      deleteQuote.mutate(quoteId, {
        onError: (err: Error) => {
          setDeleteError(err.message || "Error al eliminar el presupuesto");
        },
      });
    }
  };

  if (isLoading) {
    return <p className="text-[rgba(255,255,255,0.72)]">Cargando presupuestos...</p>;
  }

  if (error) {
    return <AlertBanner message="Error al cargar presupuestos." variant="error" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg tracking-tight text-white">Presupuestos</h2>
        <Link
          to="/quotes/new"
          className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98]"
        >
          Nuevo Presupuesto
        </Link>
      </div>

      {isWaError && (
        <AlertBanner message="Error al cargar el presupuesto para WhatsApp." variant="error" />
      )}

      {deleteError && (
        <AlertBanner message={deleteError} variant="error" />
      )}

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Numero
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Cliente
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Total
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Estado
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Fecha
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {data && data.items.length > 0 ? (
              data.items.map((q) => (
                <tr
                  key={q.id}
                  className="border-b border-[rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {q.quote_number}
                  </td>
                  <td className="px-4 py-3 text-white">{q.client_name}</td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatCurrency(q.total)}
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#ef4444]">
                      {q.status === "draft" ? "Borrador" : q.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                    {formatDate(q.created_at)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/api/quotes/${q.id}/pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
                      >
                        PDF
                      </a>
                      <button
                        onClick={() => handleWhatsApp(q.id)}
                        disabled={isWaLoading && whatsappQuoteId === q.id}
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30 disabled:opacity-50"
                        title="Enviar por WhatsApp"
                      >
                        {isWaLoading && whatsappQuoteId === q.id ? "..." : "WhatsApp"}
                      </button>
                      <Link
                        to={`/quotes/${q.id}/edit`}
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
                      >
                        Editar
                      </Link>
                      <button
                        onClick={() => handleDelete(q.id, q.quote_number)}
                        disabled={deleteQuote.isPending}
                        className="rounded-full bg-[rgba(220,38,38,0.1)] px-3 py-1 text-xs font-medium text-[#ef4444] transition-all duration-200 hover:bg-[rgba(220,38,38,0.2)] disabled:opacity-50"
                      >
                        {deleteQuote.isPending ? "..." : "Eliminar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                >
                  No hay presupuestos registrados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
