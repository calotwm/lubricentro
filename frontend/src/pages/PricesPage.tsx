import { useState } from "react";
import { useCategories, useBrands, useProducts } from "../hooks/useProducts";
import { useBulkPriceUpdate } from "../hooks/useReports";
import AlertBanner from "../components/ui/AlertBanner";

export default function PricesPage() {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productsData } = useProducts();

  const [filterType, setFilterType] = useState<"brand" | "category">("brand");
  const [selectedId, setSelectedId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const bulkUpdate = useBulkPriceUpdate();

  // Count affected products
  const affectedCount = productsData?.items.filter((p) => {
    if (filterType === "brand") return p.brand_id === Number(selectedId);
    return p.category_id === Number(selectedId);
  }).length ?? 0;

  const handleApply = () => {
    setSuccess("");
    setError("");

    if (!selectedId) {
      setError("Seleccione una marca o categoria.");
      return;
    }
    if (!percentage || isNaN(Number(percentage))) {
      setError("Ingrese un porcentaje valido.");
      return;
    }

    const payload =
      filterType === "brand"
        ? { brand_id: Number(selectedId), percentage }
        : { category_id: Number(selectedId), percentage };

    bulkUpdate.mutate(payload, {
      onSuccess: (data) => {
        setSuccess(`Se actualizaron ${data.updated} productos con un ${percentage}%.`);
        setSelectedId("");
        setPercentage("");
      },
      onError: (err: Error) => setError(err.message),
    });
  };

  const inputClass =
    "w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";
  const labelClass = "mb-1 block text-sm font-medium text-[#a0a0a0]";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
        <h2 className="mb-4 text-lg font-semibold text-white">Actualizacion Masiva de Precios</h2>

        {success && <div className="mb-4"><AlertBanner message={success} variant="success" /></div>}
        {error && <div className="mb-4"><AlertBanner message={error} variant="error" /></div>}

        <div className="space-y-4">
          {/* Filter type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => { setFilterType("brand"); setSelectedId(""); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filterType === "brand"
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#222] text-white border border-[#333] hover:bg-[#2a2a2a]"
              }`}
            >
              Por Marca
            </button>
            <button
              onClick={() => { setFilterType("category"); setSelectedId(""); }}
              className={`rounded-lg px-4 py-2 text-sm font-medium ${
                filterType === "category"
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#222] text-white border border-[#333] hover:bg-[#2a2a2a]"
              }`}
            >
              Por Categoria
            </button>
          </div>

          {/* Select */}
          <div>
            <label className={labelClass}>
              {filterType === "brand" ? "Marca" : "Categoria"}
            </label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className={inputClass}
            >
              <option value="">-- Seleccionar --</option>
              {filterType === "brand"
                ? brands?.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))
                : categories?.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
            </select>
          </div>

          {/* Percentage */}
          <div>
            <label className={labelClass}>
              Porcentaje (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ej: 10 para +10%"
              className={inputClass}
            />
          </div>

          {/* Preview */}
          {selectedId && (
            <div className="rounded-lg bg-[#222] p-4 text-sm text-[#a0a0a0]">
              <p>
                <span className="font-semibold text-white">{affectedCount}</span> producto{affectedCount !== 1 ? "s" : ""} {affectedCount !== 1 ? "seran" : "sera"} afectado{affectedCount !== 1 ? "s" : ""}.
              </p>
              {percentage && !isNaN(Number(percentage)) && (
                <p className="mt-1">
                  Los precios de venta {Number(percentage) >= 0 ? "aumentaran" : "disminuiran"} un{" "}
                  <span className="font-semibold text-white">{Math.abs(Number(percentage))}%</span>.
                </p>
              )}
            </div>
          )}

          {/* Apply */}
          <button
            onClick={handleApply}
            disabled={bulkUpdate.isPending || !selectedId || !percentage}
            className="w-full rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
          >
            {bulkUpdate.isPending ? "Aplicando..." : "Aplicar Actualizacion"}
          </button>
        </div>
      </div>
    </div>
  );
}
