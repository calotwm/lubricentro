import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateQuote } from "../../hooks/useQuotes";
import { useProducts } from "../../hooks/useProducts";
import AlertBanner from "../../components/ui/AlertBanner";

interface LineItem {
  product_id: number | null;
  description: string;
  quantity: number;
  unit_price: string;
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num);
}

export default function QuoteFormPage() {
  const navigate = useNavigate();
  const createQuote = useCreateQuote();
  const { data: products } = useProducts(undefined, undefined, undefined, 1, 200);

  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [items, setItems] = useState<LineItem[]>([
    { product_id: null, description: "", quantity: 1, unit_price: "0" },
  ]);
  const [error, setError] = useState("");

  const addItem = () => {
    setItems([...items, { product_id: null, description: "", quantity: 1, unit_price: "0" }]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof LineItem, value: string | number | null) => {
    const updated = [...items];
    const item = updated[index];
    if (item) {
      (item as unknown as Record<string, unknown>)[field] = value;
    }
    setItems(updated);
  };

  const handleProductSelect = (index: number, productId: number | null) => {
    const updated = [...items];
    const item = updated[index];
    if (!item) return;
    if (productId && products) {
      const product = products.items.find((p) => p.id === productId);
      if (product) {
        updated[index] = {
          product_id: productId,
          description: product.name,
          quantity: item.quantity,
          unit_price: product.selling_price ?? "0",
        };
      }
    } else {
      item.product_id = null;
    }
    setItems(updated);
  };

  const total = items.reduce((sum, item) => {
    return sum + (parseFloat(item.unit_price) || 0) * (item.quantity || 0);
  }, 0);

  const handleSubmit = () => {
    if (!clientName.trim()) {
      setError("El nombre del cliente es obligatorio.");
      return;
    }
    if (items.length === 0) {
      setError("Agregue al menos un item.");
      return;
    }

    setError("");
    createQuote.mutate(
      {
        client_name: clientName.trim(),
        client_phone: clientPhone.trim() || null,
        items: items.map((item) => ({
          product_id: item.product_id,
          description: item.description || "Item",
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
      {
        onSuccess: () => navigate("/quotes"),
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  const inputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";

  return (
    <div className="space-y-6">
      <h2 className="text-lg tracking-tight text-white">Nuevo Presupuesto</h2>

      {/* Client info */}
      <div className="glass-card space-y-4 p-6">
        <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.72)]">
          Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]">
              Nombre *
            </label>
            <input
              type="text"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nombre del cliente"
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]">
              Telefono
            </label>
            <input
              type="text"
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="11-XXXX-XXXX"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Line items */}
      <div className="glass-card space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[rgba(255,255,255,0.72)]">
            Items
          </h3>
          <button
            onClick={addItem}
            className="rounded-full border border-[rgba(255,255,255,0.15)] px-4 py-1.5 text-xs font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
          >
            + Agregar Item
          </button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="grid grid-cols-12 gap-3 items-end">
            <div className="col-span-4">
              <label className="mb-1 block text-xs text-[rgba(255,255,255,0.45)]">
                Producto
              </label>
              <select
                value={item.product_id ?? ""}
                onChange={(e) =>
                  handleProductSelect(
                    index,
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className={inputClass}
              >
                <option value="">Seleccionar...</option>
                {products?.items.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-3">
              <label className="mb-1 block text-xs text-[rgba(255,255,255,0.45)]">
                Descripcion
              </label>
              <input
                type="text"
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Descripcion"
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-[rgba(255,255,255,0.45)]">
                Cantidad
              </label>
              <input
                type="number"
                min={1}
                value={item.quantity}
                onChange={(e) =>
                  updateItem(index, "quantity", Math.max(1, Number(e.target.value)))
                }
                className={inputClass}
              />
            </div>
            <div className="col-span-2">
              <label className="mb-1 block text-xs text-[rgba(255,255,255,0.45)]">
                P. Unit.
              </label>
              <input
                type="number"
                min={0}
                step="0.01"
                value={item.unit_price}
                onChange={(e) => updateItem(index, "unit_price", e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="col-span-1 flex items-center justify-end">
              <button
                onClick={() => removeItem(index)}
                className="rounded-full bg-[rgba(220,38,38,0.1)] px-2 py-1 text-xs font-medium text-[#ef4444] transition-all duration-200 hover:bg-[rgba(220,38,38,0.2)]"
                title="Eliminar item"
              >
                X
              </button>
            </div>
          </div>
        ))}

        {/* Total */}
        <div className="flex justify-end border-t border-[rgba(255,255,255,0.12)] pt-4">
          <div className="text-right">
            <p className="text-sm text-[rgba(255,255,255,0.45)]">Total</p>
            <p className="text-xl font-semibold text-white">
              {formatCurrency(total)}
            </p>
          </div>
        </div>
      </div>

      {error && <AlertBanner message={error} variant="error" />}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          onClick={() => navigate("/quotes")}
          className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
        >
          Cancelar
        </button>
        <button
          onClick={handleSubmit}
          disabled={createQuote.isPending}
          className="rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-5 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:opacity-50"
        >
          {createQuote.isPending ? "Guardando..." : "Crear Presupuesto"}
        </button>
      </div>
    </div>
  );
}
