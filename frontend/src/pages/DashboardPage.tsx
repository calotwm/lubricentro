import { useDashboard } from "../hooks/useReports";
import { useStockMovements } from "../hooks/useStock";
import KpiCard from "../components/ui/KpiCard";
import AlertBanner from "../components/ui/AlertBanner";

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeBadge: Record<string, string> = {
  ENTRY: "text-[#22c55e]",
  EXIT: "text-[#dc2626]",
  ADJUSTMENT: "text-[#eab308]",
};

const typeLabel: Record<string, string> = {
  ENTRY: "ENTRADA",
  EXIT: "SALIDA",
  ADJUSTMENT: "AJUSTE",
};

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const { data: movements } = useStockMovements(undefined, undefined, 0, 10);

  if (isLoading) {
    return <p className="text-[#a0a0a0]">Cargando...</p>;
  }

  if (error) {
    return <AlertBanner message="Error al cargar el panel principal." variant="error" />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Valor del Inventario"
          value={formatCurrency(dashboard.total_inventory_value)}
          subtitle="Total a costo"
        />
        <KpiCard
          label="Stock Bajo"
          value={String(dashboard.low_stock_count)}
          subtitle="Por debajo del minimo"
        />
        <KpiCard
          label="Ventas del Dia"
          value={formatCurrency(dashboard.today_sales_total)}
          subtitle="Hoy"
        />
        <KpiCard
          label="Ventas del Mes"
          value={formatCurrency(dashboard.month_sales_total)}
          subtitle="Mes en curso"
        />
      </div>

      {/* Low Stock Alerts */}
      {dashboard.low_stock_products.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-white">Productos con Stock Bajo</h2>
          <div className="space-y-2">
            {dashboard.low_stock_products.map((p) => (
              <AlertBanner
                key={p.id}
                message={`${p.name} — ${p.current_stock} en stock (min: ${p.min_stock})`}
                variant="warning"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold text-white">Movimientos Recientes</h2>
        <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#333] bg-[#222]">
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Fecha</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Tipo</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Cantidad</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Referencia</th>
              </tr>
            </thead>
            <tbody>
              {movements && movements.length > 0 ? (
                movements.map((m) => (
                  <tr key={m.id} className="border-b border-[#333]">
                    <td className="px-4 py-3 text-white">{formatDate(m.created_at)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge[m.type] ?? "text-[#a0a0a0]"}`}
                      >
                        {typeLabel[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{m.quantity}</td>
                    <td className="px-4 py-3 text-[#a0a0a0]">{m.reference ?? "\u2014"}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#666]">
                    Sin movimientos recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
