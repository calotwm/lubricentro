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
    <aside className="flex h-full w-60 flex-col border-r border-[#333] bg-black">
      <div className="flex h-16 items-center border-b border-[#333] px-6">
        <span className="text-lg font-bold tracking-wide text-[#dc2626]">
          LUBRICENTRO G&amp;G
        </span>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === "/dashboard"}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-[#dc2626] text-white"
                  : "text-[#a0a0a0] hover:bg-[#222] hover:text-white"
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
