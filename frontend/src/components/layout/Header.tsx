import { useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

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
  const { logout } = useAuth();

  const title = pathname.match(/\/products\/\d+\/edit/)
    ? "Editar Producto"
    : (titleMap[pathname] ?? "Lubricentro");

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.12)] bg-black px-8">
      <h1 className="text-xl tracking-tight text-white">{title}</h1>
      <button
        onClick={logout}
        className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
