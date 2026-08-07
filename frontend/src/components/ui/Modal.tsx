import { useEffect, type ReactNode } from "react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export default function Modal({ open, onClose, title, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/70" onClick={onClose} />
      <div className="glass-card relative z-10 w-full max-w-lg p-8">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg tracking-tight text-white">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 text-[rgba(255,255,255,0.45)] transition-all duration-200 hover:bg-[rgba(255,255,255,0.08)] hover:text-white"
          >
            &#10005;
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
