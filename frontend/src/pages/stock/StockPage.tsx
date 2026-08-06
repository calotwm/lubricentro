import { useState } from "react";
import { Link } from "react-router-dom";
import { useStockMovements } from "../../hooks/useStock";
import { useProducts } from "../../hooks/useProducts";
import AlertBanner from "../../components/ui/AlertBanner";

const typeBadge: Record<string, string> = {
  ENTRY: "text-[#22c55e]",
  EXIT: "text-[#ef4444]",
  ADJUSTMENT: "text-[#eab308]",
};

const typeLabel: Record<string, string> = {
  ENTRY: "ENTRADA",
  EXIT: "SALIDA",
  ADJUSTMENT: "AJUSTE",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function StockPage() {
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [productId, setProductId] = useState<number | null>(null);

  const { data: movements, isLoading, error } = useStockMovements(
    productId,
    typeFilter || null,
  );
  const { data: productsData } = useProducts();

  if (isLoading)
    return (
      <p className="text-[rgba(255,255,255,0.72)]">Cargando movimientos...</p>
    );
  if (error)
    return (
      <AlertBanner
        message="Error al cargar movimientos de stock."
        variant="error"
      />
    );

  const selectClass =
    "rounded-full border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-4 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className={selectClass}
        >
          <option value="">Todos los tipos</option>
          <option value="ENTRY">Entrada</option>
          <option value="EXIT">Salida</option>
          <option value="ADJUSTMENT">Ajuste</option>
        </select>
        <select
          value={productId ?? ""}
          onChange={(e) =>
            setProductId(e.target.value ? Number(e.target.value) : null)
          }
          className={selectClass}
        >
          <option value="">Todos los productos</option>
          {productsData?.items.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Link
            to="/stock/receive"
            className="inline-flex items-center rounded-full bg-[#dc2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c]"
          >
            Recepcion de Mercaderia
          </Link>
        </div>
      </div>

      {/* Movements Table */}
      <div className="overflow-x-auto rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Fecha
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Producto ID
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Tipo
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Cantidad
              </th>
              <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                Referencia
              </th>
            </tr>
          </thead>
          <tbody>
            {movements && movements.length > 0 ? (
              movements.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-[rgba(255,255,255,0.12)]"
                >
                  <td className="px-4 py-3 text-white">
                    {formatDate(m.created_at)}
                  </td>
                  <td className="px-4 py-3 text-white">{m.product_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge[m.type] ?? "text-[rgba(255,255,255,0.45)]"}`}
                    >
                      {typeLabel[m.type] ?? m.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white">{m.quantity}</td>
                  <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                    {m.reference ?? "\u2014"}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                >
                  No se encontraron movimientos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
