import { useEffect, useState } from "react";

/**
 * Brand color map for the 26 brands in the database.
 * Keys are UPPERCASE brand names.
 */
const BRAND_COLORS: Record<string, { bg: string; text: string }> = {
  VALVOLINE: { bg: "#d50032", text: "#ffffff" },
  TOTAL: { bg: "#e30613", text: "#ffffff" },
  MOBIL: { bg: "#005EB8", text: "#ffffff" },
  CASTROL: { bg: "#00A651", text: "#ffffff" },
  SHELL: { bg: "#F5B700", text: "#1a1a1a" },
  YPF: { bg: "#0072BC", text: "#ffffff" },
  MOTUL: { bg: "#7AB900", text: "#ffffff" },
  FRAM: { bg: "#F26F21", text: "#ffffff" },
  "MANN FILTER": { bg: "#005CAB", text: "#ffffff" },
  "MANN-FILTER": { bg: "#005CAB", text: "#ffffff" },
  MASTERFILT: { bg: "#6b7280", text: "#ffffff" },
  FAP: { bg: "#6b7280", text: "#ffffff" },
  TECNECO: { bg: "#6b7280", text: "#ffffff" },
  ELF: { bg: "#D6001C", text: "#ffffff" },
  TUTELA: { bg: "#6b7280", text: "#ffffff" },
  BARDAHL: { bg: "#6b7280", text: "#ffffff" },
  "LIQUI MOLY": { bg: "#003C71", text: "#ffffff" },
  "LIQUI-MOLY": { bg: "#003C71", text: "#ffffff" },
  QUIMBAT: { bg: "#6b7280", text: "#ffffff" },
  GULF: { bg: "#6b7280", text: "#ffffff" },
  WEGA: { bg: "#6b7280", text: "#ffffff" },
  VARIOS: { bg: "#6b7280", text: "#ffffff" },
  FARO: { bg: "#6b7280", text: "#ffffff" },
  MARENO: { bg: "#6b7280", text: "#ffffff" },
  DM: { bg: "#6b7280", text: "#ffffff" },
  PUMA: { bg: "#6b7280", text: "#ffffff" },
  BATERIA: { bg: "#00A651", text: "#ffffff" },
};

const DEFAULT_COLOR = { bg: "#6b7280", text: "#ffffff" };

const BRAND_LOGOS: Record<string, string | undefined> = {
  VALVOLINE: "https://www.google.com/s2/favicons?domain=valvoline.com&sz=128",
  TOTAL: "https://www.google.com/s2/favicons?domain=totalenergies.com&sz=128",
  MOBIL: "https://www.google.com/s2/favicons?domain=mobil.com&sz=128",
  CASTROL: "https://www.google.com/s2/favicons?domain=castrol.com&sz=128",
  SHELL: "https://www.google.com/s2/favicons?domain=shell.com&sz=128",
  YPF: "https://www.google.com/s2/favicons?domain=ypf.com&sz=128",
  MOTUL: "https://www.google.com/s2/favicons?domain=motul.com&sz=128",
  FRAM: "https://www.google.com/s2/favicons?domain=fram.com&sz=128",
  "MANN FILTER": "https://www.google.com/s2/favicons?domain=mann-filter.com&sz=128",
  "MANN-FILTER": "https://www.google.com/s2/favicons?domain=mann-filter.com&sz=128",
  "LIQUI MOLY": "https://www.google.com/s2/favicons?domain=liqui-moly.com&sz=128",
  "LIQUI-MOLY": "https://www.google.com/s2/favicons?domain=liqui-moly.com&sz=128",
  ELF: "https://www.google.com/s2/favicons?domain=elflubricants.com&sz=128",
  GULF: "https://www.google.com/s2/favicons?domain=gulf.com&sz=128",
  TUTELA: "https://www.google.com/s2/favicons?domain=tutela.com&sz=128",
  BARDAHL: "https://www.google.com/s2/favicons?domain=bardahl.com&sz=128",
};

function getInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const words = trimmed.split(/\s+/);
  if (words.length >= 2) {
    const first = words[0]?.charAt(0) ?? "";
    const second = words[1]?.charAt(0) ?? "";
    return (first + second).toUpperCase();
  }
  return trimmed.substring(0, 2).toUpperCase();
}

function getBrandColor(name: string) {
  const key = name.trim().toUpperCase();
  return BRAND_COLORS[key] ?? DEFAULT_COLOR;
}

interface BrandBadgeProps {
  name: string;
  size?: "sm" | "md";
}

export default function BrandBadge({ name, size = "sm" }: BrandBadgeProps) {
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [name]);

  if (!name || !name.trim()) return null;

  const colors = getBrandColor(name);
  const initials = getInitials(name);
  const logoUrl = BRAND_LOGOS[name.trim().toUpperCase()];
  const showLogo = !!logoUrl && !imgError;

  const badgeSize =
    size === "md" ? "h-8 w-8 text-xs" : "h-5 w-5 text-[10px]";
  const textSize = size === "md" ? "text-sm" : "text-xs";

  return (
    <div className="group flex items-center gap-2">
      {showLogo ? (
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          onError={() => setImgError(true)}
          className={`${size === "md" ? "h-8 w-8" : "h-5 w-5"} rounded-full object-cover transition-transform duration-150 group-hover:scale-110`}
        />
      ) : (
        <span
          className={`${badgeSize} flex shrink-0 items-center justify-center rounded-full font-semibold transition-transform duration-150 group-hover:scale-110`}
          style={{ backgroundColor: colors.bg, color: colors.text }}
        >
          {initials}
        </span>
      )}
      <span className={`${textSize} text-white`}>{name}</span>
    </div>
  );
}
