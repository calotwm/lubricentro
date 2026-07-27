interface AlertBannerProps {
  message: string;
  variant?: "warning" | "error" | "info" | "success";
}

const styles: Record<string, string> = {
  warning: "border-[#eab308]/30 bg-[#eab308]/10 text-[#eab308]",
  error: "border-[#dc2626]/30 bg-[#dc2626]/10 text-[#dc2626]",
  info: "border-[#3b82f6]/30 bg-[#3b82f6]/10 text-[#3b82f6]",
  success: "border-[#22c55e]/30 bg-[#22c55e]/10 text-[#22c55e]",
};

export default function AlertBanner({ message, variant = "warning" }: AlertBannerProps) {
  return (
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles[variant] ?? styles.warning}`}>
      {message}
    </div>
  );
}
