"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";

type Toast = {
  id: number;
  title: string;
  description?: string;
  variant: "success" | "info" | "error";
};

const ToastContext = createContext<{
  toast: (t: Omit<Toast, "id" | "variant"> & { variant?: Toast["variant"] }) => void;
} | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(0);

  const toast = useCallback<
    (t: Omit<Toast, "id" | "variant"> & { variant?: Toast["variant"] }) => void
  >((t) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...t, id, variant: t.variant ?? "success" }]);
    setTimeout(
      () => setToasts((prev) => prev.filter((x) => x.id !== id)),
      4200,
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={(id) => setToasts((p) => p.filter((t) => t.id !== id))} />
    </ToastContext.Provider>
  );
}

function ToastViewport({
  toasts,
  onDismiss,
}: {
  toasts: Toast[];
  onDismiss: (id: number) => void;
}) {
  return (
    <div
      aria-live="polite"
      aria-atomic="false"
      className="pointer-events-none fixed bottom-5 left-1/2 z-[120] flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 flex-col gap-2 sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0"
    >
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const accent =
    toast.variant === "error"
      ? "text-red-400"
      : toast.variant === "info"
        ? "text-blue-400"
        : "text-cyan-400";

  return (
    <div
      className={`glass border-glow pointer-events-auto flex items-start gap-3 rounded-xl px-4 py-3 shadow-card transition-all duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] ${
        shown ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
      role="status"
    >
      <span className={`mt-0.5 shrink-0 ${accent}`} aria-hidden>
        {toast.variant === "error" ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="9" />
            <path d="m8.5 12.5 2.5 2.5 4.5-5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.description && (
          <p className="mt-0.5 text-xs text-silver-400">{toast.description}</p>
        )}
      </div>
      <button
        onClick={onDismiss}
        aria-label="Fechar aviso"
        className="shrink-0 text-silver-400 transition-colors hover:text-white"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast precisa estar dentro de <ToastProvider>");
  return ctx.toast;
}
