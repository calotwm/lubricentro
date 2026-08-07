import { useState } from "react";
import { Link } from "react-router-dom";
import { useSales, type Sale } from "../../hooks/useSales";
import AlertBanner from "../../components/ui/AlertBanner";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(parseFloat(value));
}

const paymentLabels: Record<string, string> = {
  cash: "Efectivo",
  debit: "Debito",
  credit: "Credito",
  transfer: "Transferencia",
};

export default function SalesListPage() {
  const { data: sales, isLoading, error } = useSales();
  const [expandedId, setExpandedId] = useState<number | null>(null);

  if (isLoading)
    return (
      <p className="text-[rgba(255,255,255,0.72)]">Cargando ventas...</p>
    );
  if (error)
    return <AlertBanner message="Error al cargar ventas." variant="error" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[rgba(255,255,255,0.72)]">
          {sales?.length ?? 0} venta{(sales?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <Link
          to="/sales/new"
          className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98]"
        >
          Nueva Venta
        </Link>
      </div>

      <div className="glass-card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Fecha
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Total
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Pago
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Items
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Detalle
              </th>
            </tr>
          </thead>
          <tbody>
            {sales && sales.length > 0 ? (
              sales.flatMap((sale: Sale) => {
                const isExpanded = expandedId === sale.id;
                const rows = [
                  <tr
                    key={sale.id}
                    className="cursor-pointer border-b border-[rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-white/[0.03]"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : sale.id)
                    }
                  >
                    <td className="px-4 py-3 text-white">
                      {formatDate(sale.created_at)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#ef4444]">
                        {paymentLabels[sale.payment_method] ??
                          sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">
                      {sale.items.length}
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.28)]">
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </td>
                  </tr>,
                ];

                if (isExpanded) {
                  rows.push(
                    <tr
                      key={`${sale.id}-items`}
                      className="bg-[#0a0a0a]"
                    >
                      <td colSpan={5} className="px-8 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[rgba(255,255,255,0.45)]">
                            Detalle de Venta
                          </p>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[rgba(255,255,255,0.45)]">
                                <th className="pb-1 font-medium">
                                  Producto ID
                                </th>
                                <th className="pb-1 font-medium">Cant.</th>
                                <th className="pb-1 font-medium">
                                  Precio Unit.
                                </th>
                                <th className="pb-1 font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1 text-white">
                                    {item.product_id}
                                  </td>
                                  <td className="py-1 text-white">
                                    {item.quantity}
                                  </td>
                                  <td className="py-1 text-white">
                                    {formatCurrency(item.unit_price)}
                                  </td>
                                  <td className="py-1 font-medium text-white">
                                    {formatCurrency(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          {sale.notes && (
                            <p className="text-xs text-[rgba(255,255,255,0.72)]">
                              Notas: {sale.notes}
                            </p>
                          )}
                        </div>
                      </td>
                    </tr>,
                  );
                }
                return rows;
              })
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                >
                  No hay ventas registradas.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
