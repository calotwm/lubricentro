import { useState, useRef } from "react";
import { useCategories, useBrands, useProducts } from "../hooks/useProducts";
import { useBulkPriceUpdate, useImportExcel } from "../hooks/useReports";
import AlertBanner from "../components/ui/AlertBanner";

export default function PricesPage() {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productsData } = useProducts();

  const [filterType, setFilterType] = useState<"brand" | "category">("brand");
  const [selectedId, setSelectedId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [note, setNote] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const bulkUpdate = useBulkPriceUpdate();

  // Count affected products
  const affectedCount =
    productsData?.items.filter((p) => {
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
        ? { brand_id: Number(selectedId), percentage, note: note || null }
        : { category_id: Number(selectedId), percentage, note: note || null };

    bulkUpdate.mutate(payload, {
      onSuccess: (data) => {
        setSuccess(
          `Se actualizaron ${data.updated} productos con un ${percentage}%.`,
        );
        setSelectedId("");
        setPercentage("");
        setNote("");
      },
      onError: (err: Error) => setError(err.message),
    });
  };

  const inputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";
  const labelClass =
    "mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]";

  return (
    <div className="mx-auto max-w-xl space-y-6">
      <div className="glass-card p-8">
        <h2 className="mb-4 text-lg tracking-tight text-white">
          Actualizacion Masiva de Precios
        </h2>

        {success && (
          <div className="mb-4">
            <AlertBanner message={success} variant="success" />
          </div>
        )}
        {error && (
          <div className="mb-4">
            <AlertBanner message={error} variant="error" />
          </div>
        )}

        <div className="space-y-4">
          {/* Filter type toggle */}
          <div className="flex gap-2">
            <button
              onClick={() => {
                setFilterType("brand");
                setSelectedId("");
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                filterType === "brand"
                  ? "bg-[#dc2626] text-white"
                  : "border border-[rgba(255,255,255,0.15)] text-white hover:bg-white/10 hover:border-white/30"
              }`}
            >
              Por Marca
            </button>
            <button
              onClick={() => {
                setFilterType("category");
                setSelectedId("");
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-all duration-200 ${
                filterType === "category"
                  ? "bg-[#dc2626] text-white"
                  : "border border-[rgba(255,255,255,0.15)] text-white hover:bg-white/10 hover:border-white/30"
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
            <label className={labelClass}>Porcentaje (%)</label>
            <input
              type="number"
              step="0.01"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              placeholder="Ej: 10 para +10%"
              className={inputClass}
            />
          </div>

          {/* Note / Reason */}
          <div>
            <label className={labelClass}>Motivo / Nota (opcional)</label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Ej: Ajuste trimestral, inflación, etc."
              className={inputClass}
            />
          </div>

          {/* Preview */}
          {selectedId && (
            <div className="rounded-[12px] bg-[#0a0a0a] p-4 text-sm text-[rgba(255,255,255,0.72)]">
              <p>
                <span className="font-semibold text-white">{affectedCount}</span>{" "}
                producto{affectedCount !== 1 ? "s" : ""}{" "}
                {affectedCount !== 1 ? "seran" : "sera"} afectado
                {affectedCount !== 1 ? "s" : ""}.
              </p>
              {percentage && !isNaN(Number(percentage)) && (
                <p className="mt-1">
                  Los precios de venta{" "}
                  {Number(percentage) >= 0 ? "aumentaran" : "disminuiran"} un{" "}
                  <span className="font-semibold text-white">
                    {Math.abs(Number(percentage))}%
                  </span>
                  .
                </p>
              )}
            </div>
          )}

          {/* Apply */}
          <button
            onClick={handleApply}
            disabled={
              bulkUpdate.isPending || !selectedId || !percentage
            }
            className="w-full rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:opacity-50"
          >
            {bulkUpdate.isPending ? "Aplicando..." : "Aplicar Actualizacion"}
          </button>
        </div>
      </div>

      {/* Excel upload section */}
      <ExcelUploadSection />
    </div>
  );
}

function ExcelUploadSection() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    updated: number;
    created: number;
    skipped: number;
    errors: string[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useImportExcel();

  const handleUpload = () => {
    if (!file) return;
    setResult(null);
    upload.mutate(file, {
      onSuccess: (data) => setResult(data),
    });
  };

  const fileInputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-[linear-gradient(135deg,#dc2626,#991b1b)] file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white file:transition-all file:duration-200 file:hover:brightness-110";

  return (
    <div className="rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8">
      <h2 className="mb-4 text-lg tracking-tight text-white">
        Actualizar Precios desde Excel
      </h2>
      <p className="mb-4 text-sm text-[rgba(255,255,255,0.72)]">
        Subi un archivo .xlsx con columnas de producto y precio para actualizar
        los precios de venta.
      </p>

      {upload.isError && (
        <div className="mb-4">
          <AlertBanner
            message={
              upload.error?.message || "Error al procesar el archivo"
            }
            variant="error"
          />
        </div>
      )}

      {result && (
        <div className="mb-4 space-y-2 rounded-[12px] bg-[#0a0a0a] p-4">
          <div className="flex flex-wrap gap-4 text-sm">
            {result.updated > 0 && (
              <span className="text-[#22c55e]">
                {result.updated} actualizados
              </span>
            )}
            {result.created > 0 && (
              <span className="text-white">{result.created} creados</span>
            )}
            {result.skipped > 0 && (
              <span className="text-[#eab308]">
                {result.skipped} omitidos
              </span>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="text-xs text-[#ef4444]">
              {result.errors.slice(0, 5).map((e, i) => (
                <p key={i}>{e}</p>
              ))}
              {result.errors.length > 5 && (
                <p>... y {result.errors.length - 5} mas</p>
              )}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={(e) => {
            setFile(e.target.files?.[0] ?? null);
            setResult(null);
          }}
          className={fileInputClass}
        />
        <button
          onClick={handleUpload}
          disabled={!file || upload.isPending}
          className="w-full rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98] disabled:opacity-50"
        >
          {upload.isPending ? "Procesando..." : "Subir y Actualizar Precios"}
        </button>
      </div>
    </div>
  );
}
