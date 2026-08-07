import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Panel Principal" },
  { to: "/products", label: "Productos" },
  { to: "/stock", label: "Stock" },
  { to: "/sales", label: "Ventas" },
  { to: "/prices", label: "Precios" },
  { to: "/reports", label: "Reportes" },
];

export default function Sidebar() {
  return (
    <aside className="flex h-full w-60 flex-col border-r border-[rgba(255,255,255,0.12)] bg-black">
      <div className="flex h-16 items-center border-b border-[rgba(255,255,255,0.12)] px-6">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
          <span className="font-['Space_Grotesk'] text-base font-semibold tracking-wide text-white">
            <span className="text-[#dc2626]">L</span>UBRICENTRO
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-full px-4 py-2.5 text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-[#dc2626] text-white"
                  : "text-[rgba(255,255,255,0.72)] hover:bg-white/5 hover:text-white"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
