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
    currency: "USD",
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
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "stock_history.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const tabClass = (t: Tab) =>
    `px-4 py-2 text-sm font-medium rounded-t-lg ${
      tab === t
        ? "border-b-2 border-[#dc2626] text-white"
        : "text-[#a0a0a0] hover:text-white"
    }`;

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-[#333]">
        <button onClick={() => setTab("best-sellers")} className={tabClass("best-sellers")}>
          Mas Vendidos
        </button>
        <button onClick={() => setTab("reorder")} className={tabClass("reorder")}>
          Lista de Reposicion
        </button>
        <button onClick={() => setTab("profit")} className={tabClass("profit")}>
          Margen de Ganancia
        </button>
      </div>

      {/* Best Sellers */}
      {tab === "best-sellers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Productos Mas Vendidos</h2>
            <button
              onClick={handleExportCsv}
              className="rounded-lg bg-[#222] px-4 py-2 text-sm font-medium text-white border border-[#333] hover:bg-[#2a2a2a]"
            >
              Exportar CSV
            </button>
          </div>
          {loadingBest ? (
            <p className="text-[#a0a0a0]">Cargando...</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333] bg-[#222]">
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">#</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Producto</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Cant. Vendida</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Ingresos</th>
                  </tr>
                </thead>
                <tbody>
                  {bestSellers && bestSellers.length > 0 ? (
                    bestSellers.map((item, i) => (
                      <tr key={item.product_id} className="border-b border-[#333]">
                        <td className="px-4 py-3 text-[#a0a0a0]">{i + 1}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {item.product_name}
                        </td>
                        <td className="px-4 py-3 text-white">{item.total_quantity_sold}</td>
                        <td className="px-4 py-3 font-medium text-white">
                          {formatCurrency(item.total_revenue)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#666]">
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
          <h2 className="text-lg font-semibold text-white">Lista de Reposicion</h2>
          {loadingReorder ? (
            <p className="text-[#a0a0a0]">Cargando...</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-[#333] bg-[#222]">
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Producto</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Stock Actual</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Stock Minimo</th>
                    <th className="px-4 py-3 font-medium text-[#a0a0a0]">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {reorder && reorder.length > 0 ? (
                    reorder.map((p) => (
                      <tr key={p.id} className="border-b border-[#333]">
                        <td className="px-4 py-3 font-medium text-white">{p.name}</td>
                        <td className="px-4 py-3 font-semibold text-[#dc2626]">
                          {p.current_stock}
                        </td>
                        <td className="px-4 py-3 text-white">{p.min_stock}</td>
                        <td className="px-4 py-3">
                          <span className="rounded-full bg-[#dc2626]/10 px-2.5 py-0.5 text-xs font-medium text-[#dc2626]">
                            Bajo
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-[#666]">
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
          <h2 className="text-lg font-semibold text-white">Margen de Ganancia</h2>
          {loadingProfit ? (
            <p className="text-[#a0a0a0]">Cargando...</p>
          ) : profit ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-sm text-[#a0a0a0]">Ingresos Totales</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatCurrency(profit.total_revenue)}
                </p>
              </div>
              <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-sm text-[#a0a0a0]">Costo Total</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {formatCurrency(profit.total_cost)}
                </p>
              </div>
              <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-sm text-[#a0a0a0]">Ganancia Bruta</p>
                <p className="mt-1 text-xl font-bold text-[#22c55e]">
                  {formatCurrency(profit.gross_profit)}
                </p>
              </div>
              <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
                <p className="text-sm text-[#a0a0a0]">Margen</p>
                <p className="mt-1 text-xl font-bold text-[#dc2626]">
                  {parseFloat(profit.margin_percentage).toFixed(2)}%
                </p>
              </div>
            </div>
          ) : (
            <AlertBanner message="No se pudo cargar los datos de ganancia." variant="error" />
          )}
        </div>
      )}
    </div>
  );
}
