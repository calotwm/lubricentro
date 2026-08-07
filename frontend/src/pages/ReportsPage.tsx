import { useState } from "react";
import {
  useBestSellers,
  useProfitMargin,
  useReorderList,
  useStockHistoryCsv,
} from "../hooks/useReports";
import AlertBanner from "../components/ui/AlertBanner";

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(parseFloat(value));
}

type Tab = "best-sellers" | "reorder" | "profit";

export default function ReportsPage() {
  const [tab, setTab] = useState<Tab>("best-sellers");

  const { data: bestSellers, isLoading: loadingBest } = useBestSellers();
  const { data: profit, isLoading: loadingProfit } = useProfitMargin();
  const { data: reorder, isLoading: loadingReorder } = useReorderList();
  const { data: history } = useStockHistoryCsv();

  const handleExportCsv = () => {
    if (!history || history.length === 0) return;
    const headers = ["date", "product", "type", "quantity", "reference"];
    const rows = history.map((h) => [
      h.created_at ?? "",
      h.product_name,
      h.type,
      String(h.quantity),
      h.reference ?? "",
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join(
      "\n",
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Tabs — pill row */}
      <div className="flex gap-2">
        {(
          [
            { key: "best-sellers" as Tab, label: "Mas Vendidos" },
            { key: "reorder" as Tab, label: "Lista de Reposicion" },
            { key: "profit" as Tab, label: "Margen de Ganancia" },
          ] as const
        ).map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
              tab === t.key
                ? "bg-[#dc2626] text-white"
                : "border border-[rgba(255,255,255,0.15)] text-[rgba(255,255,255,0.72)] hover:bg-white/10 hover:border-white/30 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Best Sellers */}
      {tab === "best-sellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg tracking-tight text-white">
              Productos Mas Vendidos
            </h2>
            <button
              onClick={handleExportCsv}
              className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
            >
              Exportar CSV
            </button>
          </div>
          {loadingBest ? (
            <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>
          ) : (
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      #
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Cant. Vendida
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Ingresos
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers && bestSellers.length > 0 ? (
                    bestSellers.map((item, i) => (
                      <tr
                        key={item.product_id}
                        className="border-b border-[rgba(255,255,255,0.12)]"
                      >
                        <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                          {i + 1}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-white">
                          {item.total_quantity_sold}
                        </td>
                        <td className="px-4 py-3 font-medium text-white">
                          {formatCurrency(item.total_revenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                      >
                        Sin datos de ventas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Reorder List */}
      {tab === "reorder" && (
        <div className="space-y-4">
          <h2 className="text-lg tracking-tight text-white">
            Lista de Reposicion
          </h2>
          {loadingReorder ? (
            <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>
          ) : (
            <div className="glass-card overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Producto
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Stock Actual
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Stock Minimo
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {reorder && reorder.length > 0 ? (
                    reorder.map((p) => (
                      <tr
                        key={p.id}
                        className="border-b border-[rgba(255,255,255,0.12)]"
                      >
                        <td className="px-4 py-3 font-medium text-white">
                          {p.name}
                        </td>
                        <td className="px-4 py-3 font-semibold text-[#ef4444]">
                          {p.current_stock}
                        </td>
                        <td className="px-4 py-3 text-white">{p.min_stock}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#ef4444]">
                            Bajo
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                      >
                        Todos los productos estan por encima del stock minimo.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Profit Margin */}
      {tab === "profit" && (
        <div className="space-y-4">
          <h2 className="text-lg tracking-tight text-white">
            Margen de Ganancia
          </h2>
          {loadingProfit ? (
            <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>
          ) : profit ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card glass-card-hover p-8">
                <p className="text-sm text-[rgba(255,255,255,0.72)]">
                  Ingresos Totales
                </p>
                <p className="mt-1 text-xl font-medium tracking-tight text-white">
                  {formatCurrency(profit.total_revenue)}
                </p>
              </div>
              <div className="glass-card glass-card-hover p-8">
                <p className="text-sm text-[rgba(255,255,255,0.72)]">
                  Costo Total
                </p>
                <p className="mt-1 text-xl font-medium tracking-tight text-white">
                  {formatCurrency(profit.total_cost)}
                </p>
              </div>
              <div className="glass-card glass-card-hover p-8">
                <p className="text-sm text-[rgba(255,255,255,0.72)]">
                  Ganancia Bruta
                </p>
                <p className="mt-1 text-xl font-medium tracking-tight text-[#22c55e]">
                  {formatCurrency(profit.gross_profit)}
                </p>
              </div>
              <div className="glass-card glass-card-hover p-8">
                <p className="text-sm text-[rgba(255,255,255,0.72)]">Margen</p>
                <p className="mt-1 text-xl font-medium tracking-tight text-[#ef4444]">
                  {parseFloat(profit.margin_percentage).toFixed(2)}%
                </p>
              </div>
            </div>
          ) : (
            <AlertBanner
              message="No se pudo cargar los datos de ganancia."
              variant="error"
            />
          )}
        </div>
      )}
    </div>
  );
}
