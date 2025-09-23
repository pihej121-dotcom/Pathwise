// client/src/components/ui/use-toast.ts
import * as React from "react";

type Toast = {
  id: string;
  title?: string;
  description?: string;
};

const ToastContext = React.createContext<{
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
}>({
  toasts: [],
  toast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const toast = (t: Omit<Toast, "id">) => {
    setToasts((prev) => [...prev, { ...t, id: Date.now().toString() }]);
    // Auto-remove after 5s
    setTimeout(
      () => setToasts((prev) => prev.slice(1)),
      5000
    );
  };

  return (
    <ToastContext.Provider value={{ toasts, toast }}>
      {children}
      <div className="fixed bottom-4 right-4 space-y-2 z-50">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="bg-card border border-border p-3 rounded-md shadow-md"
          >
            <p className="font-semibold">{t.title}</p>
            {t.description && (
              <p className="text-sm text-muted-foreground">
                {t.description}
              </p>
            )}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return React.useContext(ToastContext);
}
