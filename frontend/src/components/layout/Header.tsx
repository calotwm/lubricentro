import { useLocation } from "react-router-dom";

const titleMap: Record<string, string> = {
  "/dashboard": "Panel Principal",
  "/products": "Productos",
  "/products/new": "Nuevo Producto",
  "/prices": "Gestion de Precios",
  "/quotes": "Presupuestos",
  "/quotes/new": "Nuevo Presupuesto",
  "/reports": "Reportes",
};

export default function Header() {
  const { pathname } = useLocation();

  const title = pathname.match(/\/products\/\d+\/edit/)
    ? "Editar Producto"
    : (titleMap[pathname] ?? "Lubricentro");

  return (
    <header className="flex h-16 items-center border-b border-[rgba(255,255,255,0.12)] bg-black px-8">
      <h1 className="text-xl tracking-tight text-white">{title}</h1>
    </header>
  );
}
