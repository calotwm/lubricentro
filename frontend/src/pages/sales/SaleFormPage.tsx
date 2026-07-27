import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useCreateSale, type SaleItemPayload } from "../../hooks/useSales";
import AlertBanner from "../../components/ui/AlertBanner";
import { formatARS } from "../../utils/currency";

interface CartItem extends SaleItemPayload {
  product_name: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Debito" },
  { value: "credit", label: "Credito" },
  { value: "transfer", label: "Transferencia" },
];

export default function SaleFormPage() {
  const navigate = useNavigate();
  const { data: productsData } = useProducts();
  const createSale = useCreateSale();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");

  const filteredProducts = productsData?.items.filter(
    (p) =>
      p.is_active &&
      p.name.toLowerCase().includes(search.toLowerCase()),
  ).slice(0, 8);

  const addToCart = (productId: number) => {
    const product = productsData?.items.find((p) => p.id === productId);
    if (!product) return;

    setCart((prev) => {
      const existing = prev.find((c) => c.product_id === productId);
      if (existing) {
        return prev.map((c) =>
          c.product_id === productId
            ? { ...c, quantity: c.quantity + 1 }
            : c,
        );
      }
      return [
        ...prev,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.selling_price ?? "0",
        },
      ];
    });
    setSearch("");
  };

  const updateQty = (productId: number, qty: number) => {
    if (qty < 1) return;
    setCart((prev) =>
      prev.map((c) => (c.product_id === productId ? { ...c, quantity: qty } : c)),
    );
  };

  const removeFromCart = (productId: number) => {
    setCart((prev) => prev.filter((c) => c.product_id !== productId));
  };

  const total = cart.reduce(
    (sum, item) => sum + parseFloat(item.unit_price) * item.quantity,
    0,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (cart.length === 0) {
      setError("Se requiere al menos un producto.");
      return;
    }

    createSale.mutate(
      {
        items: cart.map((c) => ({
          product_id: c.product_id,
          quantity: c.quantity,
          unit_price: c.unit_price,
        })),
        payment_method: paymentMethod,
      },
      {
        onSuccess: () => navigate("/sales"),
        onError: (err: Error) => setError(err.message),
      },
    );
  };

  const inputClass =
    "w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-4 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Product search */}
      <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
        <h2 className="mb-3 text-lg font-semibold text-white">Agregar Productos</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar productos por nombre..."
          className={inputClass}
        />
        {search && filteredProducts && filteredProducts.length > 0 && (
          <div className="mt-2 rounded-lg border border-[#333] bg-[#1a1a1a]">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm hover:bg-[#222]"
              >
                <span className="font-medium text-white">{p.name}</span>
                <span className="text-[#a0a0a0]">
                  Stock: {p.current_stock} | {formatARS(p.selling_price ?? 0)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <AlertBanner message={error} variant="error" />}

      {/* Cart */}
      {cart.length > 0 && (
        <div className="rounded-xl border border-[#333] bg-[#1a1a1a]">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[#333] bg-[#222]">
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Producto</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Cant.</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Precio Unit.</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Subtotal</th>
                <th className="px-4 py-3 font-medium text-[#a0a0a0]">Accion</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr key={item.product_id} className="border-b border-[#333]">
                  <td className="px-4 py-3 font-medium text-white">{item.product_name}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.product_id, item.quantity - 1)}
                        className="rounded bg-[#222] px-2 py-0.5 text-xs text-white hover:bg-[#2a2a2a]"
                      >
                        &minus;
                      </button>
                      <span className="w-8 text-center text-white">{item.quantity}</span>
                      <button
                        onClick={() => updateQty(item.product_id, item.quantity + 1)}
                        className="rounded bg-[#222] px-2 py-0.5 text-xs text-white hover:bg-[#2a2a2a]"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    {formatARS(item.unit_price)}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    {formatARS(parseFloat(item.unit_price) * item.quantity)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
                      className="text-sm text-[#dc2626] hover:text-[#b91c1c]"
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

      {/* Payment + Submit */}
      <form onSubmit={handleSubmit} className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[#a0a0a0]">
              Metodo de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-[#a0a0a0]">Total</p>
            <p className="text-2xl font-bold text-white">{formatARS(total)}</p>
          </div>
          <button
            type="submit"
            disabled={createSale.isPending || cart.length === 0}
            className="rounded-lg bg-[#dc2626] px-6 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
          >
            {createSale.isPending ? "Procesando..." : "Confirmar Venta"}
          </button>
        </div>
      </form>
    </div>
  );
}
