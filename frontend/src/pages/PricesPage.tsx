import { useState, useRef } from "react";
import { useCategories, useBrands, useProducts } from "../hooks/useProducts";
import { useBulkPriceUpdate, useUploadExcel } from "../hooks/useReports";
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
        ? { brand_id: Number(selectedId), percentage }
        : { category_id: Number(selectedId), percentage };

    bulkUpdate.mutate(payload, {
      onSuccess: (data) => {
        setSuccess(
          `Se actualizaron ${data.updated} productos con un ${percentage}%.`,
        );
        setSelectedId("");
        setPercentage("");
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
      <div className="rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8">
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
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                filterType === "brand"
                  ? "bg-[#dc2626] text-white"
                  : "border border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.05)]"
              }`}
            >
              Por Marca
            </button>
            <button
              onClick={() => {
                setFilterType("category");
                setSelectedId("");
              }}
              className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
                filterType === "category"
                  ? "bg-[#dc2626] text-white"
                  : "border border-[rgba(255,255,255,0.15)] text-white hover:bg-[rgba(255,255,255,0.05)]"
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
            className="w-full rounded-full bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50"
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
    actualizados: number;
    no_encontrados: number;
    errores: string[];
    detalle: {
      producto: string;
      precio_anterior: string;
      precio_nuevo: string;
    }[];
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useUploadExcel();

  const handleUpload = () => {
    if (!file) return;
    setResult(null);
    upload.mutate(file, {
      onSuccess: (data) => setResult(data),
    });
  };

  const fileInputClass =
    "w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white file:mr-3 file:rounded-full file:border-0 file:bg-[#dc2626] file:px-4 file:py-1 file:text-sm file:font-semibold file:text-white file:hover:bg-[#b91c1c]";

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
          <div className="flex gap-4 text-sm">
            <span className="text-[#22c55e]">
              {result.actualizados} actualizados
            </span>
            {result.no_encontrados > 0 && (
              <span className="text-[#eab308]">
                {result.no_encontrados} no encontrados
              </span>
            )}
          </div>
          {result.errores.length > 0 && (
            <div className="text-xs text-[#ef4444]">
              {result.errores.map((e, i) => (
                <p key={i}>{e}</p>
              ))}
            </div>
          )}
          {result.detalle.length > 0 && (
            <div className="max-h-40 overflow-y-auto text-xs text-[rgba(255,255,255,0.72)]">
              {result.detalle.slice(0, 10).map((d, i) => (
                <p key={i}>
                  {d.producto}: ${d.precio_anterior}{" "}
                  <span className="text-white">${d.precio_nuevo}</span>
                </p>
              ))}
              {result.detalle.length > 10 && (
                <p className="text-[rgba(255,255,255,0.28)]">
                  ... y {result.detalle.length - 10} mas
                </p>
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
          className="w-full rounded-full bg-[#dc2626] px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50"
        >
          {upload.isPending ? "Procesando..." : "Subir y Actualizar Precios"}
        </button>
      </div>
    </div>
  );
}
