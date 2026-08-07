import { Link } from "react-router-dom";
import { useDashboard } from "../hooks/useReports";
import KpiCard from "../components/ui/KpiCard";
import AlertBanner from "../components/ui/AlertBanner";

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num);
}

interface NavCard {
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const navCards: NavCard[] = [
  {
    to: "/products",
    title: "Lista de Productos",
    subtitle: "Ver y editar el catalogo",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    to: "/prices",
    title: "Actualizar Precios",
    subtitle: "Cambios de precio masivos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    to: "/quotes",
    title: "Presupuestos",
    subtitle: "Crear y consultar presupuestos",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
        <polyline points="10 9 9 9 8 9" />
      </svg>
    ),
  },
  {
    to: "/reports",
    title: "Reportes",
    subtitle: "Historial de precios y exportacion",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard();

  if (isLoading) {
    return <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>;
  }

  if (error) {
    return <AlertBanner message="Error al cargar el panel principal." variant="error" />;
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-10">
      {/* Hero header area */}
      <div className="-mx-8 -mt-8 px-8 pt-8 pb-2">
        <h2 className="font-['Space_Grotesk'] text-4xl font-semibold tracking-tight text-white">
          <span className="text-[#dc2626]">L</span>ubricentro
        </h2>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
          Gestion de inventario y precios
        </p>
      </div>

      {/* Navigation glass cards grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {navCards.map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="glass-card glass-card-hover group relative flex flex-col gap-4 overflow-hidden rounded-2xl p-6 text-left transition-all duration-200"
          >
            <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-0 bg-[#dc2626] transition-all duration-300 group-hover:w-full" />
            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[rgba(255,255,255,0.85)] ring-1 ring-white/10 transition-colors duration-200 group-hover:bg-[#dc2626]/10 group-hover:text-[#ef4444] group-hover:ring-[#dc2626]/30">
                {card.icon}
              </div>
              <span className="translate-x-0 text-sm font-medium text-[rgba(255,255,255,0.35)] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#ef4444]">
                Entrar &rarr;
              </span>
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-semibold tracking-tight text-white">
                {card.title}
              </h3>
              <p className="text-sm text-[rgba(255,255,255,0.55)]">
                {card.subtitle}
              </p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Total Productos"
          value={String(dashboard.total_products)}
          subtitle="Productos activos"
        />
        <KpiCard
          label="Total Marcas"
          value={String(dashboard.total_brands)}
          subtitle="Marcas registradas"
        />
        <KpiCard
          label="Cambios Recientes"
          value={String(dashboard.recent_price_changes.length)}
          subtitle="Ultimos cambios de precio"
        />
        <KpiCard
          label="Presupuestos"
          value={String(dashboard.recent_quotes.length)}
          subtitle="Ultimos presupuestos"
        />
      </div>

      {/* Recent Price Changes */}
      {dashboard.recent_price_changes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg tracking-tight text-white">
            Cambios de Precio Recientes
          </h2>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Producto</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Precio Ant.</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Precio Nuevo</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Origen</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_price_changes.map((pc) => (
                  <tr key={pc.id} className="border-b border-[rgba(255,255,255,0.12)]">
                    <td className="px-4 py-3 font-medium text-white">{pc.product_name}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">{formatCurrency(pc.old_price)}</td>
                    <td className="px-4 py-3 text-white">{formatCurrency(pc.new_price)}</td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-[rgba(220,38,38,0.1)] px-2.5 py-0.5 text-xs font-medium text-[#ef4444]">
                        {pc.source}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">{formatDate(pc.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recent Quotes */}
      {dashboard.recent_quotes.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg tracking-tight text-white">Presupuestos Recientes</h2>
          <div className="glass-card overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Numero</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Cliente</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Total</th>
                  <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">Fecha</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recent_quotes.map((q) => (
                  <tr key={q.id} className="border-b border-[rgba(255,255,255,0.12)]">
                    <td className="px-4 py-3 font-medium text-white">{q.quote_number}</td>
                    <td className="px-4 py-3 text-white">{q.client_name}</td>
                    <td className="px-4 py-3 font-medium text-white">{formatCurrency(q.total)}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">{formatDate(q.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
