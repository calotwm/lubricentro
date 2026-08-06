import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProducts } from "../../hooks/useProducts";
import { useCreateSale, type SaleItemPayload } from "../../hooks/useSales";
import AlertBanner from "../../components/ui/AlertBanner";
import { TypewriterPlaceholder } from "../../components/ui/TypewriterEffect";

interface CartItem extends SaleItemPayload {
  product_name: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Efectivo" },
  { value: "debit", label: "Debito" },
  { value: "credit", label: "Credito" },
  { value: "transfer", label: "Transferencia" },
];

const searchPhrases = ["Buscar producto para agregar..."];

export default function SaleFormPage() {
  const navigate = useNavigate();
  const { data: productsData } = useProducts();
  const createSale = useCreateSale();

  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [error, setError] = useState("");

  const filteredProducts = productsData?.items
    .filter(
      (p) =>
        p.is_active &&
        p.name.toLowerCase().includes(search.toLowerCase()),
    )
    .slice(0, 8);

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
      prev.map((c) =>
        c.product_id === productId ? { ...c, quantity: qty } : c,
      ),
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
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Product search */}
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8">
        <h2 className="mb-3 text-lg tracking-tight text-white">
          Agregar Productos
        </h2>
        <TypewriterPlaceholder
          phrases={searchPhrases}
          value={search}
          onChange={setSearch}
          className={inputClass}
        />
        {search && filteredProducts && filteredProducts.length > 0 && (
          <div className="mt-2 rounded-[12px] border border-[rgba(255,255,255,0.12)] bg-[#16181a]">
            {filteredProducts.map((p) => (
              <button
                key={p.id}
                onClick={() => addToCart(p.id)}
                className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-all duration-200 hover:bg-white/[0.05]"
              >
                <span className="font-medium text-white">{p.name}</span>
                <span className="text-[rgba(255,255,255,0.72)]">
                  Stock: {p.current_stock} | $
                  {p.selling_price
                    ? parseFloat(p.selling_price).toFixed(2)
                    : "0.00"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <AlertBanner message={error} variant="error" />}

      {/* Cart */}
      {cart.length > 0 && (
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
                  Precio Unit.
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Subtotal
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Accion
                </th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item) => (
                <tr
                  key={item.product_id}
                  className="border-b border-[rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-white/[0.03]"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {item.product_name}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateQty(item.product_id, item.quantity - 1)
                        }
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-2 py-0.5 text-xs text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
                      >
                        &minus;
                      </button>
                      <span className="w-8 text-center text-white">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQty(item.product_id, item.quantity + 1)
                        }
                        className="rounded-full border border-[rgba(255,255,255,0.15)] px-2 py-0.5 text-xs text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
                      >
                        +
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-white">
                    ${parseFloat(item.unit_price).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 font-medium text-white">
                    $
                    {(
                      parseFloat(item.unit_price) * item.quantity
                    ).toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => removeFromCart(item.product_id)}
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

      {/* Payment + Submit */}
      <form
        onSubmit={handleSubmit}
        className="rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8"
      >
        <div className="flex flex-wrap items-end gap-6">
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]">
              Metodo de Pago
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="rounded-full border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-4 py-2.5 text-sm text-white focus:border-[#dc2626] focus:outline-none"
            >
              {PAYMENT_METHODS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-right">
            <p className="text-sm text-[rgba(255,255,255,0.72)]">Total</p>
            <p className="text-2xl font-medium tracking-tight text-white">
              ${total.toFixed(2)}
            </p>
          </div>
          <button
            type="submit"
            disabled={createSale.isPending || cart.length === 0}
            className="rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:opacity-50"
          >
            {createSale.isPending ? "Procesando..." : "Confirmar Venta"}
          </button>
        </div>
      </form>
    </div>
  );
}
