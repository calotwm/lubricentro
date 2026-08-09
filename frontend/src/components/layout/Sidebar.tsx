import { NavLink } from "react-router-dom";

const links = [
  { to: "/dashboard", label: "Panel Principal" },
  { to: "/products", label: "Productos" },
  { to: "/prices", label: "Precios" },
  { to: "/quotes", label: "Presupuestos" },
  { to: "/reports", label: "Reportes" },
];

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop — visible only below md when drawer is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 md:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          flex h-full w-60 flex-col border-r border-[rgba(255,255,255,0.12)] bg-black
          /* Below md: fixed drawer overlay */
          fixed left-0 top-0 z-40
          /* Transition for slide in/out */
          transition-transform duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          /* At md and above: always visible, relative, no transform */
          md:relative md:z-auto md:translate-x-0
        `}
      >
        <div className="flex h-16 items-center justify-between border-b border-[rgba(255,255,255,0.12)] px-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-[#dc2626]" />
            <span className="font-['Space_Grotesk'] text-base font-semibold tracking-wide text-white">
              <span className="text-[#dc2626]">L</span>UBRICENTRO
            </span>
          </div>
          {/* Close button — visible only below md */}
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[rgba(255,255,255,0.45)] transition hover:bg-white/10 hover:text-white md:hidden"
            aria-label="Cerrar menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === "/dashboard"}
              onClick={onClose}
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
    </>
  );
}
