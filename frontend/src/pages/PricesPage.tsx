import { useRef, useState } from "react";
import { useCategories, useBrands, useProducts } from "../hooks/useProducts";
import { useBulkPriceUpdate, useImportExcel, type ExcelImportResult } from "../hooks/useReports";
import AlertBanner from "../components/ui/AlertBanner";

const inputClass =
  "w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]";
const labelClass = "mb-1 block text-sm font-medium text-[#a0a0a0]";

// ── Template download ────────────────────────────────────────────────────────
function downloadTemplate() {
  // Build a minimal CSV that the user can open in Excel and save as xlsx
  const rows = [
    ["SKU", "Nombre", "Marca", "Categoria", "Precio Costo", "Precio Venta"],
    ["MARC-001", "Aceite 10W40 1L", "VALVOLINE", "Aceites", "5000", "7500"],
    ["", "Filtro de Aceite X", "MANN", "Filtros", "", "3200"],
  ];
  const csv = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "plantilla_precios.csv";
  a.click();
  URL.revokeObjectURL(url);
}

// ── Bulk update section ──────────────────────────────────────────────────────
function BulkUpdateSection() {
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const { data: productsData } = useProducts();

  const [filterType, setFilterType] = useState<"brand" | "category">("brand");
  const [selectedId, setSelectedId] = useState("");
  const [percentage, setPercentage] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const bulkUpdate = useBulkPriceUpdate();

  const affectedCount =
    productsData?.items.filter((p) => {
      if (filterType === "brand") return p.brand_id === Number(selectedId);
      return p.category_id === Number(selectedId);
    }).length ?? 0;

  const handleApply = () => {
    setSuccess("");
    setError("");
    if (!selectedId) { setError("Seleccione una marca o categoria."); return; }
    if (!percentage || isNaN(Number(percentage))) { setError("Ingrese un porcentaje valido."); return; }

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

  return (
    <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
      <h2 className="mb-4 text-lg font-semibold text-white">Actualizacion Masiva de Precios</h2>

      {success && <div className="mb-4"><AlertBanner message={success} variant="success" /></div>}
      {error && <div className="mb-4"><AlertBanner message={error} variant="error" /></div>}

      <div className="space-y-4">
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

        <div>
          <label className={labelClass}>{filterType === "brand" ? "Marca" : "Categoria"}</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputClass}>
            <option value="">-- Seleccionar --</option>
            {filterType === "brand"
              ? brands?.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)
              : categories?.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

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

        {selectedId && (
          <div className="rounded-lg bg-[#222] p-4 text-sm text-[#a0a0a0]">
            <p>
              <span className="font-semibold text-white">{affectedCount}</span>{" "}
              producto{affectedCount !== 1 ? "s" : ""}{" "}
              {affectedCount !== 1 ? "seran" : "sera"} afectado{affectedCount !== 1 ? "s" : ""}.
            </p>
            {percentage && !isNaN(Number(percentage)) && (
              <p className="mt-1">
                Los precios de venta{" "}
                {Number(percentage) >= 0 ? "aumentaran" : "disminuiran"} un{" "}
                <span className="font-semibold text-white">{Math.abs(Number(percentage))}%</span>.
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleApply}
          disabled={bulkUpdate.isPending || !selectedId || !percentage}
          className="w-full rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
        >
          {bulkUpdate.isPending ? "Aplicando..." : "Aplicar Actualizacion"}
        </button>
      </div>
    </div>
  );
}

// ── Excel import section ─────────────────────────────────────────────────────
function ExcelImportSection() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [result, setResult] = useState<ExcelImportResult | null>(null);
  const [error, setError] = useState("");

  const importExcel = useImportExcel();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setSelectedFile(f);
    setResult(null);
    setError("");
  };

  const handleImport = () => {
    if (!selectedFile) return;
    setError("");
    setResult(null);
    importExcel.mutate(selectedFile, {
      onSuccess: (data) => {
        setResult(data);
        setSelectedFile(null);
        if (fileRef.current) fileRef.current.value = "";
      },
      onError: (err: Error) => setError(err.message),
    });
  };

  return (
    <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Importar Precios desde Excel</h2>
        <button
          onClick={downloadTemplate}
          className="rounded-lg border border-[#333] bg-[#222] px-3 py-1.5 text-xs font-medium text-[#a0a0a0] hover:bg-[#2a2a2a] hover:text-white"
        >
          Descargar Plantilla
        </button>
      </div>

      <p className="mb-4 text-sm text-[#a0a0a0]">
        Sube un archivo <span className="font-medium text-white">.xlsx</span> con columnas:{" "}
        <span className="font-mono text-xs text-[#dc2626]">SKU, Nombre, Marca, Categoria, Precio Costo, Precio Venta</span>.
        Si el SKU coincide con un producto existente se actualizan sus precios; si no existe, se crea como nuevo.
      </p>

      {error && <div className="mb-4"><AlertBanner message={error} variant="error" /></div>}

      {result && (
        <div className="mb-4 rounded-lg bg-[#222] p-4 text-sm">
          <p className="mb-2 font-semibold text-white">Resultado de la importacion:</p>
          <div className="flex flex-wrap gap-4">
            <span className="text-[#22c55e]">✓ {result.updated} actualizados</span>
            <span className="text-[#3b82f6]">+ {result.created} creados</span>
            <span className="text-[#a0a0a0]">— {result.skipped} omitidos</span>
          </div>
          {result.errors.length > 0 && (
            <div className="mt-3 space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-[#dc2626]">{e}</p>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label className={labelClass}>Archivo Excel (.xlsx)</label>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx"
            onChange={handleFileChange}
            className="w-full cursor-pointer rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-[#dc2626] file:px-3 file:py-1 file:text-xs file:font-medium file:text-white hover:file:bg-[#b91c1c]"
          />
        </div>

        {selectedFile && (
          <p className="text-xs text-[#a0a0a0]">
            Archivo seleccionado: <span className="text-white">{selectedFile.name}</span>{" "}
            ({(selectedFile.size / 1024).toFixed(1)} KB)
          </p>
        )}

        <button
          onClick={handleImport}
          disabled={!selectedFile || importExcel.isPending}
          className="w-full rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
        >
          {importExcel.isPending ? "Importando..." : "Importar"}
        </button>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function PricesPage() {
  return (
    <div className="mx-auto max-w-xl space-y-6">
      <BulkUpdateSection />
      <ExcelImportSection />
    </div>
  );
}
