import { createContext, PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, Check, Info } from 'lucide-react';

export type ToastKind = 'info' | 'success' | 'warning' | 'error';

export type ToastMessage = {
  id: string;
  message: string;
  type: ToastKind;
};

type ToastContextValue = {
  addToast: (message: string, type?: ToastKind) => void;
  dismissToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const ToastViewport = ({
  toasts,
  onDismiss,
}: {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}) => {
  if (typeof document === 'undefined') return null;

  return createPortal(
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 p-4 bg-white border-4 border-black shadow-nb min-w-[300px] animate-in slide-in-from-right"
        >
          {toast.type === 'success' && <Check className="text-green-600" size={24} strokeWidth={3} />}
          {toast.type === 'error' && <AlertCircle className="text-red-600" size={24} strokeWidth={3} />}
          {toast.type === 'info' && <Info className="text-blue-600" size={24} strokeWidth={3} />}
          {toast.type === 'warning' && <AlertCircle className="text-yellow-600" size={24} strokeWidth={3} />}
          <div className="flex-1">
            <p className="font-bold uppercase text-sm">{toast.message}</p>
          </div>
          <button
            onClick={() => onDismiss(toast.id)}
            className="text-xs font-bold underline uppercase"
            aria-label="Dismiss toast"
          >
            Close
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
};

export const ToastProvider = ({ children }: PropsWithChildren) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback((message: string, type: ToastKind = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => dismissToast(id), 4000);
  }, [dismissToast]);

  const value = useMemo<ToastContextValue>(
    () => ({
      addToast,
      dismissToast,
    }),
    [addToast, dismissToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismissToast} />
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};
