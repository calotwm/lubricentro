import { useState } from "react";
import {
  usePriceHistory,
  handleExportCsv,
  type PriceHistoryFilters,
} from "../hooks/useReports";
import { useProducts, useBrands } from "../hooks/useProducts";
import AlertBanner from "../components/ui/AlertBanner";

function formatCurrency(value: string): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
  }).format(parseFloat(value));
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const sourceLabels: Record<string, string> = {
  bulk: "Masivo",
  excel: "Excel",
  manual: "Manual",
};

export default function ReportsPage() {
  const [filters, setFilters] = useState<PriceHistoryFilters>({});
  const { data, isLoading, error } = usePriceHistory(filters);
  const { data: products } = useProducts(undefined, undefined, undefined, 1, 200);
  const { data: brands } = useBrands();

  const selectClass =
    "rounded-full border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-4 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg tracking-tight text-white">Historial de Precios</h2>
        <button
          onClick={() => handleExportCsv(filters).catch(() => {})}
          className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
        >
          Exportar CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={filters.product_id ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              product_id: e.target.value ? Number(e.target.value) : null,
            })
          }
          className={selectClass}
        >
          <option value="">Todos los productos</option>
          {products?.items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <select
          value={filters.brand_id ?? ""}
          onChange={(e) =>
            setFilters({
              ...filters,
              brand_id: e.target.value ? Number(e.target.value) : null,
            })
          }
          className={selectClass}
        >
          <option value="">Todas las marcas</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <select
          value={filters.source ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, source: e.target.value || null })
          }
          className={selectClass}
        >
          <option value="">Todos los origenes</option>
          <option value="bulk">Masivo</option>
          <option value="excel">Excel</option>
          <option value="manual">Manual</option>
        </select>
        <input
          type="date"
          value={filters.date_from ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, date_from: e.target.value || null })
          }
          className={selectClass}
          placeholder="Desde"
        />
        <input
          type="date"
          value={filters.date_to ?? ""}
          onChange={(e) =>
            setFilters({ ...filters, date_to: e.target.value || null })
          }
          className={selectClass}
          placeholder="Hasta"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>
      ) : error ? (
        <AlertBanner message="Error al cargar historial." variant="error" />
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Producto
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Marca
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Precio Ant.
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Precio Nuevo
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  %
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Origen
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Fecha
                </th>
              </tr>
            </thead>
            <tbody>
              {data && data.items.length > 0 ? (
                data.items.map((item) => (
                  <tr
                    key={item.id}
                    className="border-b border-[rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 font-medium text-white">
                      {item.product_name}
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                      {item.brand_name ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                      {formatCurrency(item.old_price)}
                    </td>
                    <td className="px-4 py-3 font-medium text-white">
                      {formatCurrency(item.new_price)}
                    </td>
                    <td className="px-4 py-3 text-[#ef4444]">
                      {item.percentage ? `${item.percentage}%` : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#ef4444]">
                        {sourceLabels[item.source] ?? item.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                      {formatDate(item.created_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                  >
                    Sin cambios de precio registrados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
