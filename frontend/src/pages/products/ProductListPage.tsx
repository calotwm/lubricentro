import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import AlertBanner from "../../components/ui/AlertBanner";
import BrandBadge from "../../components/ui/BrandBadge";
import {
  useProducts,
  useCategories,
  useBrands,
  useDeleteProduct,
  type Product,
} from "../../hooks/useProducts";
import { useCreateMovement } from "../../hooks/useStock";

const searchPhrases = [
  "Buscar por nombre, marca o codigo...",
  "Buscar por viscosidad...",
  "Buscar por codigo de barras...",
];

export default function ProductListPage() {
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [brandId, setBrandId] = useState<number | null>(null);
  const [page] = useState(1);

  const { data, isLoading, error } = useProducts(search, categoryId, brandId, page);
  const { data: categories } = useCategories();
  const { data: brands } = useBrands();
  const deleteProduct = useDeleteProduct();
  const createMovement = useCreateMovement();

  // Stock adjust modal
  const [adjustProduct, setAdjustProduct] = useState<Product | null>(null);
  const [adjustQty, setAdjustQty] = useState(1);
  const [adjustReason, setAdjustReason] = useState("");
  const [adjustError, setAdjustError] = useState("");

  const handleDelete = (id: number) => {
    if (window.confirm("Esta seguro de que desea eliminar este producto?")) {
      deleteProduct.mutate(id);
    }
  };

  const openAdjust = (product: Product, qty: number) => {
    setAdjustProduct(product);
    setAdjustQty(Math.abs(qty));
    setAdjustReason("");
    setAdjustError("");
  };

  const handleAdjustSubmit = () => {
    if (!adjustProduct) return;
    if (!adjustReason.trim()) {
      setAdjustError("El motivo es obligatorio.");
      return;
    }
    createMovement.mutate(
      {
        product_id: adjustProduct.id,
        type: "ADJUSTMENT",
        quantity: adjustQty,
        reference: adjustReason,
      },
      {
        onSuccess: () => setAdjustProduct(null),
        onError: (err: Error) => setAdjustError(err.message),
      },
    );
  };

  const columns: Column<Product>[] = [
    { key: "sku", header: "Codigo", render: (r) => r.sku ?? "\u2014" },
    { key: "name", header: "Nombre" },
    {
      key: "brand",
      header: "Marca",
      render: (r) => <BrandBadge name={r.brand?.name ?? ""} />,
    },
    {
      key: "category",
      header: "Categoria",
      render: (r) => r.category?.name ?? "\u2014",
    },
    {
      key: "current_stock",
      header: "Stock",
      render: (r) => (
        <span
          className={
            r.current_stock <= r.min_stock
              ? "font-semibold text-[#ef4444]"
              : "text-white"
          }
        >
          {r.current_stock}
        </span>
      ),
    },
    {
      key: "selling_price",
      header: "Precio",
      render: (r) =>
        r.selling_price ? `$${parseFloat(r.selling_price).toFixed(2)}` : "\u2014",
    },
  ];

  if (isLoading)
    return <p className="text-[rgba(255,255,255,0.72)]">Cargando productos...</p>;
  if (error) return <AlertBanner message="Error al cargar productos." variant="error" />;

  const selectClass =
    "rounded-full border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-4 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={categoryId ?? ""}
          onChange={(e) =>
            setCategoryId(e.target.value ? Number(e.target.value) : null)
          }
          className={selectClass}
        >
          <option value="">Filtrar por categoria</option>
          {categories?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <select
          value={brandId ?? ""}
          onChange={(e) =>
            setBrandId(e.target.value ? Number(e.target.value) : null)
          }
          className={selectClass}
        >
          <option value="">Filtrar por marca</option>
          {brands?.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <Link
            to="/products/new"
            className="inline-flex items-center rounded-full bg-[#dc2626] px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c]"
          >
            Nuevo Producto
          </Link>
        </div>
      </div>

      {/* Table */}
      <DataTable<Product>
        columns={columns}
        data={data?.items ?? []}
        keyField="id"
        searchValue={search}
        onSearchChange={setSearch}
        searchPhrases={searchPhrases}
        emptyMessage="No se encontraron productos."
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdjust(row, 1)}
              className="rounded-full bg-[rgba(34,197,94,0.1)] px-2.5 py-1 text-xs font-medium text-[#22c55e] transition-colors hover:bg-[rgba(34,197,94,0.2)]"
              title="Aumentar stock"
            >
              +
            </button>
            <button
              onClick={() => openAdjust(row, -1)}
              className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-1 text-xs font-medium text-[#ef4444] transition-colors hover:bg-[rgba(220,38,38,0.2)]"
              title="Disminuir stock"
            >
              &minus;
            </button>
            <Link
              to={`/products/${row.id}/edit`}
              className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-medium text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              Editar
            </Link>
            <button
              onClick={() => handleDelete(row.id)}
              className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-1 text-xs font-medium text-[#ef4444] transition-colors hover:bg-[rgba(220,38,38,0.2)]"
            >
              Eliminar
            </button>
          </div>
        )}
      />

      {/* Stock Adjust Modal */}
      <Modal
        open={adjustProduct !== null}
        onClose={() => setAdjustProduct(null)}
        title={`Ajustar Stock: ${adjustProduct?.name ?? ""}`}
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              value={adjustQty}
              onChange={(e) =>
                setAdjustQty(Math.max(1, Number(e.target.value)))
              }
              className="w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[rgba(255,255,255,0.72)]">
              Motivo (obligatorio)
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Ej: reconteo, danado, uso interno"
              className="w-full rounded-[12px] border border-[rgba(255,255,255,0.15)] bg-[#0a0a0a] px-3 py-2.5 text-sm text-white placeholder:text-[rgba(255,255,255,0.28)] focus:border-[#dc2626] focus:outline-none focus:ring-1 focus:ring-[#dc2626]"
            />
          </div>
          {adjustError && <AlertBanner message={adjustError} variant="error" />}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAdjustProduct(null)}
              className="rounded-full border border-[rgba(255,255,255,0.15)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[rgba(255,255,255,0.05)]"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdjustSubmit}
              disabled={createMovement.isPending}
              className="rounded-full bg-[#dc2626] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50"
            >
              {createMovement.isPending ? "Guardando..." : "Ajustar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
