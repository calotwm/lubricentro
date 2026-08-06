interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export default function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="relative overflow-hidden rounded-[20px] border border-[rgba(255,255,255,0.12)] bg-[#16181a] p-8">
      <div className="absolute left-0 top-0 h-[3px] w-full bg-[#dc2626]" />
      <p className="text-sm font-medium text-[rgba(255,255,255,0.72)]">
        {label}
      </p>
      <p className="mt-3 text-2xl font-medium tracking-tight text-white">
        {value}
      </p>
      {subtitle && (
        <p className="mt-1.5 text-xs text-[rgba(255,255,255,0.45)]">
          {subtitle}
        </p>
      )}
    </div>
  );
}
