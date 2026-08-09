import { useState } from "react";
import { Link } from "react-router-dom";
import DataTable, { type Column } from "../../components/ui/DataTable";
import AlertBanner from "../../components/ui/AlertBanner";
import BrandBadge from "../../components/ui/BrandBadge";
import {
  useProducts,
  useCategories,
  useBrands,
  useDeleteProduct,
  type Product,
} from "../../hooks/useProducts";

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

  const handleDelete = (id: number) => {
    if (window.confirm("Esta seguro de que desea eliminar este producto?")) {
      deleteProduct.mutate(id);
    }
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
        <div className="sm:ml-auto">
          <Link
            to="/products/new"
            className="inline-flex items-center rounded-full bg-[linear-gradient(135deg,#dc2626,#991b1b)] px-6 py-2.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 hover:shadow-[0_0_20px_rgba(220,38,38,0.25)] active:scale-[0.98]"
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
            <Link
              to={`/products/${row.id}/edit`}
              className="rounded-full border border-[rgba(255,255,255,0.15)] px-3 py-1 text-xs font-medium text-white transition-all duration-200 hover:bg-white/10 hover:border-white/30"
            >
              Editar
            </Link>
            <button
              onClick={() => handleDelete(row.id)}
              className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-1 text-xs font-medium text-[#ef4444] transition-all duration-200 hover:bg-[rgba(220,38,38,0.2)]"
            >
              Eliminar
            </button>
          </div>
        )}
      />
    </div>
  );
}
