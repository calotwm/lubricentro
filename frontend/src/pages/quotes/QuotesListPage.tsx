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
        <table className="w-full min-w-[700px] text-left text-sm">
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
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-2 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30 md:px-3"
                        aria-label="Ver PDF"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="inline h-3.5 w-3.5">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                          <polyline points="14 2 14 8 20 8" />
                          <line x1="16" y1="13" x2="8" y2="13" />
                          <line x1="16" y1="17" x2="8" y2="17" />
                        </svg>
                        <span className="hidden md:inline"> PDF</span>
                      </a>
                      <button
                        onClick={() => handleWhatsApp(q.id)}
                        disabled={isWaLoading && whatsappQuoteId === q.id}
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-2 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30 disabled:opacity-50 md:px-3"
                        aria-label="Enviar por WhatsApp"
                      >
                        <svg viewBox="0 0 24 24" fill="currentColor" className="inline h-3.5 w-3.5">
                          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                        </svg>
                        <span className="hidden md:inline"> WhatsApp</span>
                      </button>
                      <Link
                        to={`/quotes/${q.id}/edit`}
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-2 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30 md:px-3"
                        aria-label="Editar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="inline h-3.5 w-3.5">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                        <span className="hidden md:inline"> Editar</span>
                      </Link>
                      <button
                        onClick={() => handleDelete(q.id, q.quote_number)}
                        disabled={deleteQuote.isPending}
                        className="rounded-full bg-[rgba(220,38,38,0.1)] px-2 py-1 text-xs font-medium text-[#ef4444] transition-all duration-200 hover:bg-[rgba(220,38,38,0.2)] disabled:opacity-50 md:px-3"
                        aria-label="Eliminar"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="inline h-3.5 w-3.5">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                        <span className="hidden md:inline"> Eliminar</span>
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
