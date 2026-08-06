import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useReceiveStock } from "../../hooks/useStock";
import AlertBanner from "../../components/ui/AlertBanner";

interface LineItem {
  product_id: number;
  product_name: string;
  quantity: number;
  cost_price: string;
  reference: string;
}

export default function ReceivePage() {
  const navigate = useNavigate();
  const { data: productsData } = useProducts();
  const receiveStock = useReceiveStock();

  const [lines, setLines] = useState<LineItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [costPrice, setCostPrice] = useState("");
  const [reference, setReference] = useState("");
  const [error, setError] = useState("");

  const addLine = () => {
    if (!selectedProduct || !quantity) {
      setError("Seleccione un producto e ingrese la cantidad.");
      return;
    }
    const product = productsData?.items.find(
      (p) => p.id === Number(selectedProduct),
    );
    if (!product) return;

    setLines((prev) => [
      ...prev,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: Number(quantity),
        cost_price: costPrice,
        reference,
      },
    ]);
    setSelectedProduct("");
    setQuantity("");
    setCostPrice("");
    setReference("");
    setError("");
  };

  const removeLine = (index: number) => {
    setLines((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitAll = async () => {
    if (lines.length === 0) {
      setError("Agregue al menos un articulo para recibir.");
      return;
    }
    setError("");

    try {
      for (const line of lines) {
        await receiveStock.mutateAsync({
          product_id: line.product_id,
          quantity: line.quantity,
          cost_price: line.cost_price || null,
          reference: line.reference || null,
        });
      }
      navigate("/stock");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Error al recibir stock.");
    }
  };

  const inputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";
  const labelClass =
    "mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Add line form */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8">
        <h2 className="mb-4 text-lg tracking-tight text-white">
          Agregar Articulo
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Producto</label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar producto --</option>
              {productsData?.items.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.sku ? `(${p.sku})` : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Cantidad</label>
            <input
              type="number"
              min="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio Costo (opcional)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={costPrice}
              onChange={(e) => setCostPrice(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Referencia de Factura</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className={inputClass}
              placeholder="Ej: FAC-001"
            />
          </div>
        </div>
        <button
          onClick={addLine}
          className="mt-4 rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
        >
          + Agregar a la Lista
        </button>
      </div>

      {error && <AlertBanner message={error} variant="error" />}

      {/* Lines table */}
      {lines.length > 0 && (
        <div className="overflow-x-auto rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Producto
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Cant.
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Precio Costo
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Referencia
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody>
              {lines.map((line, i) => (
                <tr
                  key={i}
                  className="border-b border-[rgba(255,255,255,0.12)]"
                >
                  <td className="px-4 py-3 text-white">{line.product_name}</td>
                  <td className="px-4 py-3 text-white">{line.quantity}</td>
                  <td className="px-4 py-3 text-white">
                    {line.cost_price
                      ? `$${parseFloat(line.cost_price).toFixed(2)}`
                      : "\u2014"}
                  </td>
                  <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                    {line.reference || "\u2014"}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeLine(i)}
                      className="text-sm font-medium text-[#ef4444] transition-colors hover:text-[#dc2626]"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Submit */}
      {lines.length > 0 && (
        <div className="flex justify-end gap-3">
          <button
            onClick={() => navigate("/stock")}
            className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmitAll}
            disabled={receiveStock.isPending}
            className="rounded-full bg-[#dc2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50"
          >
            {receiveStock.isPending ? "Recibiendo..." : "Recibir Todo"}
          </button>
        </div>
      )}
    </div>
  );
}
