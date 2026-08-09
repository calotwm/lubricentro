interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export default function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="glass-card glass-card-hover group relative overflow-hidden p-4 md:p-8">
      {/* Gradient sheen overlay */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: "var(--gradient-surface)" }}
      />
      <div className="absolute left-0 top-0 h-[3px] w-full bg-[#dc2626]" />
      <p className="relative text-sm font-medium text-[rgba(255,255,255,0.72)]">
        {label}
      </p>
      <p className="relative mt-3 text-2xl font-medium tracking-tight text-white">
        {value}
      </p>
      {subtitle && (
        <p className="relative mt-1.5 text-xs text-[rgba(255,255,255,0.45)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
