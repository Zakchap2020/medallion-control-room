import { useEffect, useState } from "react";

export type ToastType = "success" | "warning" | "error" | "info";

interface Toast {
  id: number;
  message: string;
  type: ToastType;
  exiting: boolean;
}

const COLORS: Record<ToastType, { border: string; text: string; bg: string }> = {
  success: { border: "#00ff88", text: "#00ff88", bg: "#001a0d" },
  warning: { border: "#ffa500", text: "#ffa500", bg: "#1a0a00" },
  error:   { border: "#ff4444", text: "#ff4444", bg: "#1a0000" },
  info:    { border: "#00bfff", text: "#00bfff", bg: "#001020" },
};

let _nextId = 1;
const EVENT = "mdg:toast";

export function showToast(message: string, type: ToastType = "success") {
  window.dispatchEvent(
    new CustomEvent(EVENT, { detail: { id: _nextId++, message, type } })
  );
}

export function ToastStack() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const handler = (e: Event) => {
      const { id, message, type } = (e as CustomEvent<{ id: number; message: string; type: ToastType }>).detail;
      const toast: Toast = { id, message, type, exiting: false };
      setToasts((prev) => [...prev.slice(-5), toast]);

      setTimeout(() => {
        setToasts((prev) => prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)));
        setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 220);
      }, 2500);
    };

    window.addEventListener(EVENT, handler);
    return () => window.removeEventListener(EVENT, handler);
  }, []);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: "fixed",
      top: "50px",
      right: "16px",
      zIndex: 9000,
      display: "flex",
      flexDirection: "column",
      gap: "5px",
      pointerEvents: "none",
    }}>
      {toasts.map((t) => {
        const c = COLORS[t.type];
        return (
          <div
            key={t.id}
            className={t.exiting ? "anim-toast-out" : "anim-toast-in"}
            style={{
              background: c.bg,
              border: `1px solid ${c.border}55`,
              borderLeft: `3px solid ${c.border}`,
              borderRadius: "3px",
              padding: "6px 14px 6px 10px",
              color: c.text,
              fontSize: "11px",
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: "0.03em",
              minWidth: "190px",
              boxShadow: `0 2px 14px ${c.border}18`,
              whiteSpace: "nowrap",
            }}
          >
            {t.message}
          </div>
        );
      })}
    </div>
  );
}
