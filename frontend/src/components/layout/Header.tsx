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

interface HeaderProps {
  onToggleSidebar: () => void;
}

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { pathname } = useLocation();
  const { logout } = useAuth();

  const title = pathname.match(/\/products\/\d+\/edit/)
    ? "Editar Producto"
    : (titleMap[pathname] ?? "Lubricentro");

  return (
    <header className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.12)] bg-black px-4 md:px-8">
      <div className="flex items-center gap-3">
        {/* Hamburger — visible only below md */}
        <button
          onClick={onToggleSidebar}
          className="rounded-lg p-2 text-[rgba(255,255,255,0.72)] transition hover:bg-white/10 hover:text-white block md:hidden"
          aria-label="Abrir menu"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="text-xl tracking-tight text-white">{title}</h1>
      </div>
      <button
        onClick={logout}
        className="rounded-lg border border-red-500/50 px-3 py-1.5 text-sm font-medium text-red-400 transition hover:bg-red-500/10 hover:text-red-300"
      >
        Cerrar sesión
      </button>
    </header>
  );
}
