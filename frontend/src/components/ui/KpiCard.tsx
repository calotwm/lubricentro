interface KpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
}

export default function KpiCard({ label, value, subtitle }: KpiCardProps) {
  return (
    <div className="rounded-xl border border-[#333] bg-[#1a1a1a] p-6">
      <div>
        <p className="text-sm font-medium text-[#a0a0a0]">{label}</p>
        <p className="mt-2 text-2xl font-bold text-white">{value}</p>
        {subtitle && (
          <p className="mt-1 text-xs text-[#666]">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
