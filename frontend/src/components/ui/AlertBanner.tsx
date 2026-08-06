interface AlertBannerProps {
  message: string;
  variant?: "warning" | "error" | "info" | "success";
}

const styles: Record<string, string> = {
  warning:
    "border-[rgba(234,179,8,0.3)] bg-[rgba(234,179,8,0.08)] text-[#eab308]",
  error:
    "border-[rgba(220,38,38,0.3)] bg-[rgba(220,38,38,0.08)] text-[#ef4444]",
  info: "border-[rgba(59,130,246,0.3)] bg-[rgba(59,130,246,0.08)] text-[#3b82f6]",
  success:
    "border-[rgba(34,197,94,0.3)] bg-[rgba(34,197,94,0.08)] text-[#22c55e]",
};

export default function AlertBanner({
  message,
  variant = "warning",
}: AlertBannerProps) {
  return (
    <div
      className={`rounded-[12px] border px-4 py-3 text-sm ${styles[variant] ?? styles.warning}`}
    >
      {message}
    </div>
  );
}
