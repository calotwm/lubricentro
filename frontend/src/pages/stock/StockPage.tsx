import { useState } from "react";
import { Link } from "react-router-dom";
import { useStockMovements } from "../../hooks/useStock";
import { useProducts } from "../../hooks/useProducts";
import AlertBanner from "../../components/ui/AlertBanner";

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

  if (isLoading) return <p className="text-[#a0a0a0]">Cargando movimientos...</p>;
  if (error) return <AlertBanner message="Error al cargar movimientos de stock." variant="error" />;

  const selectClass =
    "rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none";

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
            className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c]"
          >
            Recepcion de Mercaderia
          </Link>
        </div>
      </div>

      {/* Movements Table */}
      <div className="overflow-x-auto rounded-xl border border-[#333] bg-[#1a1a1a]">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[#333] bg-[#222]">
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Fecha</th>
              <th className="px-4 py-3 font-medium text-[#a0a0a0]">Producto ID</th>
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
                  <td className="px-4 py-3 text-white">{m.product_id}</td>
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
                <td colSpan={5} className="px-4 py-8 text-center text-[#666]">
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
