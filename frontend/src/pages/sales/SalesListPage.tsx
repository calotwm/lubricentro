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

import { formatARS } from "../../utils/currency";

function formatCurrency(value: string): string {
  return formatARS(value);
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

  if (isLoading) return <p className="text-[#a0a0a0]">Cargando ventas...</p>;
  if (error) return <AlertBanner message="Error al cargar ventas." variant="error" />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-[#a0a0a0]">
          {sales?.length ?? 0} venta{(sales?.length ?? 0) !== 1 ? "s" : ""}
        </p>
        <Link
          to="/sales/new"
          className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c]"
        >
          Nueva Venta
        </Link>
      </div>

      <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#333] bg-[#222]">
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Fecha</th>
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Total</th>
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Pago</th>
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Items</th>
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Detalle</th>
            </tr>
          </thead>
          <tbody>
            {sales && sales.length > 0 ? (
              sales.flatMap((sale: Sale) => {
                const isExpanded = expandedId === sale.id;
                const rows = [
                  <tr
                    key={sale.id}
                    className="cursor-pointer border-b border-[#333] hover:bg-[#222]"
                    onClick={() => setExpandedId(isExpanded ? null : sale.id)}
                  >
                    <td className="px-4 py-3 text-white">{formatDate(sale.created_at)}</td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(sale.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[#dc2626]/10 px-2.5 py-0.5 text-xs font-medium text-[#dc2626]">
                        {paymentLabels[sale.payment_method] ?? sale.payment_method}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{sale.items.length}</td>
                    <td className="px-4 py-3 text-[#666]">
                      {isExpanded ? "\u25B2" : "\u25BC"}
                    </td>
                  </tr>,
                ];

                if (isExpanded) {
                  rows.push(
                    <tr key={`${sale.id}-items`} className="bg-[#111]">
                      <td colSpan={5} className="px-8 py-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-wide text-[#a0a0a0]">
                            Detalle de Venta
                          </p>
                          <table className="w-full text-left text-xs">
                            <thead>
                              <tr className="text-[#a0a0a0]">
                                <th className="pb-1 font-medium">Producto ID</th>
                                <th className="pb-1 font-medium">Cant.</th>
                                <th className="pb-1 font-medium">Precio Unit.</th>
                                <th className="pb-1 font-medium">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item) => (
                                <tr key={item.id}>
                                  <td className="py-1 text-white">{item.product_id}</td>
                                  <td className="py-1 text-white">{item.quantity}</td>
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
                            <p className="text-xs text-[#a0a0a0]">Notas: {sale.notes}</p>
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
                <td colSpan={5} className="px-4 py-8 text-center text-[#666]">
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
