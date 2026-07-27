import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/ui/DataTable";
import Modal from "../../components/ui/Modal";
import AlertBanner from "../../components/ui/AlertBanner";
import {
  useProducts,
  useCategories,
  useBrands,
  useDeleteProduct,
  type Product,
} from "../../hooks/useProducts";
import { useCreateMovement } from "../../hooks/useStock";

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
      render: (r) => r.brand?.name ?? "\u2014",
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
              ? "font-semibold text-[#dc2626]"
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

  if (isLoading) return <p className="text-[#a0a0a0]">Cargando productos...</p>;
  if (error) return <AlertBanner message="Error al cargar productos." variant="error" />;

  const selectClass =
    "rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none";

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <select
          value={categoryId ?? ""}
          onChange={(e) => setCategoryId(e.target.value ? Number(e.target.value) : null)}
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
          onChange={(e) => setBrandId(e.target.value ? Number(e.target.value) : null)}
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
            className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c]"
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
        searchPlaceholder="Buscar por nombre, marca o codigo..."
        emptyMessage="No se encontraron productos."
        actions={(row) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => openAdjust(row, 1)}
              className="rounded bg-[#22c55e]/10 px-2 py-1 text-xs font-medium text-[#22c55e] hover:bg-[#22c55e]/20"
              title="Aumentar stock"
            >
              +
            </button>
            <button
              onClick={() => openAdjust(row, -1)}
              className="rounded bg-[#dc2626]/10 px-2 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#dc2626]/20"
              title="Disminuir stock"
            >
              &minus;
            </button>
            <Link
              to={`/products/${row.id}/edit`}
              className="rounded bg-[#222] px-2 py-1 text-xs font-medium text-white hover:bg-[#2a2a2a]"
            >
              Editar
            </Link>
            <button
              onClick={() => handleDelete(row.id)}
              className="rounded bg-[#dc2626]/10 px-2 py-1 text-xs font-medium text-[#dc2626] hover:bg-[#dc2626]/20"
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
            <label className="mb-1 block text-sm font-medium text-[#a0a0a0]">
              Cantidad
            </label>
            <input
              type="number"
              min={1}
              value={adjustQty}
              onChange={(e) => setAdjustQty(Math.max(1, Number(e.target.value)))}
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white focus:border-[#dc2626] focus:outline-none"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-[#a0a0a0]">
              Motivo (obligatorio)
            </label>
            <input
              type="text"
              value={adjustReason}
              onChange={(e) => setAdjustReason(e.target.value)}
              placeholder="Ej: reconteo, danado, uso interno"
              className="w-full rounded-lg border border-[#333] bg-[#1a1a1a] px-3 py-2 text-sm text-white placeholder:text-[#666] focus:border-[#dc2626] focus:outline-none"
            />
          </div>
          {adjustError && <AlertBanner message={adjustError} variant="error" />}
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setAdjustProduct(null)}
              className="rounded-lg bg-[#222] px-4 py-2 text-sm font-medium text-white border border-[#333] hover:bg-[#2a2a2a]"
            >
              Cancelar
            </button>
            <button
              onClick={handleAdjustSubmit}
              disabled={createMovement.isPending}
              className="rounded-lg bg-[#dc2626] px-4 py-2 text-sm font-medium text-white hover:bg-[#b91c1c] disabled:opacity-50"
            >
              {createMovement.isPending ? "Guardando..." : "Ajustar"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
