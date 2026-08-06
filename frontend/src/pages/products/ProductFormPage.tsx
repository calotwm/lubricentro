import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  useProduct,
  useCategories,
  useBrands,
  useCreateProduct,
  useUpdateProduct,
} from "../../hooks/useProducts";
import AlertBanner from "../../components/ui/AlertBanner";

export default function ProductFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const productId = id ? Number(id) : null;

  const { data: product, isLoading: loadingProduct } = useProduct(productId);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [form, setForm] = useState({
    name: "",
    sku: "",
    category_id: "" as string | number,
    brand_id: "" as string | number,
    specification: "",
    unit: "unit",
    cost_price: "",
    selling_price: "",
    current_stock: "0",
    min_stock: "0",
  });
  const [submitError, setSubmitError] = useState("");

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        sku: product.sku ?? "",
        category_id: product.category_id ?? "",
        brand_id: product.brand_id ?? "",
        specification: product.specification ?? "",
        unit: product.unit,
        cost_price: product.cost_price ?? "",
        selling_price: product.selling_price ?? "",
        current_stock: String(product.current_stock),
        min_stock: String(product.min_stock),
      });
    }
  }, [product]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    const payload = {
      name: form.name,
      sku: form.sku || null,
      category_id: form.category_id ? Number(form.category_id) : null,
      brand_id: form.brand_id ? Number(form.brand_id) : null,
      specification: form.specification || null,
      unit: form.unit,
      cost_price: form.cost_price || null,
      selling_price: form.selling_price || null,
      current_stock: Number(form.current_stock) || 0,
      min_stock: Number(form.min_stock) || 0,
    };

    if (isEdit && productId) {
      updateProduct.mutate(
        { id: productId, data: payload },
        {
          onSuccess: () => navigate("/products"),
          onError: (err: Error) => setSubmitError(err.message),
        },
      );
    } else {
      createProduct.mutate(payload, {
        onSuccess: () => navigate("/products"),
        onError: (err: Error) => setSubmitError(err.message),
      });
    }
  };

  if (isEdit && loadingProduct) {
    return (
      <p className="text-[rgba(255,255,255,0.72)]">Cargando producto...</p>
    );
  }

  const inputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";
  const labelClass =
    "mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]";

  return (
    <div className="mx-auto max-w-2xl">
      <form
        onSubmit={handleSubmit}
        className="space-y-6 rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8"
      >
        {submitError && <AlertBanner message={submitError} variant="error" />}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Nombre *</label>
            <input
              required
              type="text"
              value={form.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Codigo (SKU)</label>
            <input
              type="text"
              value={form.sku}
              onChange={(e) => handleChange("sku", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Marca</label>
            <select
              value={form.brand_id}
              onChange={(e) => handleChange("brand_id", e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar --</option>
              {brands?.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Categoria</label>
            <select
              value={form.category_id}
              onChange={(e) => handleChange("category_id", e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar --</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className={labelClass}>Especificacion</label>
          <input
            type="text"
            value={form.specification}
            onChange={(e) => handleChange("specification", e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Unidad</label>
            <input
              type="text"
              value={form.unit}
              onChange={(e) => handleChange("unit", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio Costo</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.cost_price}
              onChange={(e) => handleChange("cost_price", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Precio Venta</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.selling_price}
              onChange={(e) => handleChange("selling_price", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>Stock Actual</label>
            <input
              type="number"
              min="0"
              value={form.current_stock}
              onChange={(e) => handleChange("current_stock", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Stock Minimo</label>
            <input
              type="number"
              min="0"
              value={form.min_stock}
              onChange={(e) => handleChange("min_stock", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={() => navigate("/products")}
            className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={
              createProduct.isPending || updateProduct.isPending
            }
            className="rounded-full bg-[#dc2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50"
          >
            {isEdit ? "Actualizar Producto" : "Crear Producto"}
          </button>
        </div>
      </form>
    </div>
  );
}
