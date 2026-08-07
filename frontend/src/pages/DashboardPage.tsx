import { Link } from "react-router-dom";
import { useDashboard } from "../hooks/useReports";
import { useStockMovements } from "../hooks/useStock";
import KpiCard from "../components/ui/KpiCard";
import AlertBanner from "../components/ui/AlertBanner";

function formatCurrency(value: string | number): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(num);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-AR", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const typeBadge: Record<string, string> = {
  ENTRY: "text-[#22c55e]",
  EXIT: "text-[#ef4444]",
  ADJUSTMENT: "text-[#eab308]",
};

const typeLabel: Record<string, string> = {
  ENTRY: "ENTRADA",
  EXIT: "SALIDA",
  ADJUSTMENT: "AJUSTE",
};

interface NavCard {
  to: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
}

const navCards: NavCard[] = [
  {
    to: "/sales",
    title: "Ventas",
    subtitle: "Registrar y consultar ventas del día",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <circle cx="9" cy="21" r="1" />
        <circle cx="20" cy="21" r="1" />
        <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
      </svg>
    ),
  },
  {
    to: "/products",
    title: "Lista de Productos",
    subtitle: "Ver y editar el catálogo",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
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
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
        <line x1="7" y1="7" x2="7.01" y2="7" />
      </svg>
    ),
  },
  {
    to: "/stock",
    title: "Stock",
    subtitle: "Movimientos y recepción de mercadería",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <path d="M16.5 9.4 7.55 4.24" />
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <path d="M3.27 6.96 12 12.01l8.73-5.05" />
        <path d="M12 22.08V12" />
      </svg>
    ),
  },
  {
    to: "/reports",
    title: "Reportes",
    subtitle: "Resúmenes y exportación",
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
      >
        <line x1="18" y1="20" x2="18" y2="10" />
        <line x1="12" y1="20" x2="12" y2="4" />
        <line x1="6" y1="20" x2="6" y2="14" />
      </svg>
    ),
  },
];

export default function DashboardPage() {
  const { data: dashboard, isLoading, error } = useDashboard();
  const { data: movements } = useStockMovements(undefined, undefined, 0, 10);

  if (isLoading) {
    return <p className="text-[rgba(255,255,255,0.72)]">Cargando...</p>;
  }

  if (error) {
    return (
      <AlertBanner
        message="Error al cargar el panel principal."
        variant="error"
      />
    );
  }

  if (!dashboard) return null;

  return (
    <div className="space-y-10">
      {/* Hero header area — blends with page background */}
      <div className="-mx-8 -mt-8 px-8 pt-8 pb-2">
        <h2 className="font-['Space_Grotesk'] text-4xl font-semibold tracking-tight text-white">
          <span className="text-[#dc2626]">L</span>ubricentro
        </h2>
        <p className="mt-2 text-sm text-[rgba(255,255,255,0.55)]">
          Gestión de inventario y ventas
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
            {/* Accent top bar — hidden until hover */}
            <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-0 bg-[#dc2626] transition-all duration-300 group-hover:w-full" />

            <div className="flex items-start justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/[0.06] text-[rgba(255,255,255,0.85)] ring-1 ring-white/10 transition-colors duration-200 group-hover:bg-[#dc2626]/10 group-hover:text-[#ef4444] group-hover:ring-[#dc2626]/30">
                {card.icon}
              </div>
              <span className="translate-x-0 text-sm font-medium text-[rgba(255,255,255,0.35)] opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100 group-hover:text-[#ef4444]">
                Entrar →
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
          label="Valor del Inventario"
          value={formatCurrency(dashboard.total_inventory_value)}
          subtitle="Total a costo"
        />
        <KpiCard
          label="Stock Bajo"
          value={String(dashboard.low_stock_count)}
          subtitle="Por debajo del minimo"
        />
        <KpiCard
          label="Ventas del Dia"
          value={formatCurrency(dashboard.today_sales_total)}
          subtitle="Hoy"
        />
        <KpiCard
          label="Ventas del Mes"
          value={formatCurrency(dashboard.month_sales_total)}
          subtitle="Mes en curso"
        />
      </div>

      {/* Low Stock Alerts */}
      {dashboard.low_stock_products.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg tracking-tight text-white">
            Productos con Stock Bajo
          </h2>
          <div className="space-y-2">
            {dashboard.low_stock_products.map((p) => (
              <AlertBanner
                key={p.id}
                message={`${p.name} — ${p.current_stock} en stock (min: ${p.min_stock})`}
                variant="warning"
              />
            ))}
          </div>
        </div>
      )}

      {/* Recent Movements */}
      <div className="space-y-3">
        <h2 className="text-lg tracking-tight text-white">
          Movimientos Recientes
        </h2>
        <div className="glass-card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[rgba(255,255,255,0.12)] bg-[#0a0a0a]">
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Fecha
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Tipo
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Cantidad
                </th>
                <th className="px-4 py-3 text-sm font-medium text-[rgba(255,255,255,0.45)]">
                  Referencia
                </th>
              </tr>
            </thead>
            <tbody>
              {movements && movements.length > 0 ? (
                movements.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-[rgba(255,255,255,0.12)] transition-colors duration-150 hover:bg-white/[0.03]"
                  >
                    <td className="px-4 py-3 text-white">
                      {formatDate(m.created_at)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${typeBadge[m.type] ?? "text-[rgba(255,255,255,0.45)]"}`}
                      >
                        {typeLabel[m.type] ?? m.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-white">{m.quantity}</td>
                    <td className="px-4 py-3 text-[rgba(255,255,255,0.72)]">
                      {m.reference ?? "\u2014"}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-8 text-center text-[rgba(255,255,255,0.28)]"
                  >
                    Sin movimientos recientes.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
