import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { AlertCircle, Check, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'info' | 'warning'

export type Toast = {
  id: string
  message: string
  type: ToastType
}

type ToastContextValue = {
  addToast: (message: string, type?: ToastType) => void
  dismissToast: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

const TOAST_DURATION = 4500

function createToastId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = createToastId()
    setToasts((prev) => [...prev, { id, message, type }])
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id))
    }, TOAST_DURATION)
  }, [])

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id))
  }, [])

  const value = useMemo<ToastContextValue>(() => ({ addToast, dismissToast }), [
    addToast,
    dismissToast,
  ])

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastViewport toasts={toasts} dismissToast={dismissToast} />
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used within ToastProvider')
  return context
}

function ToastViewport({
  toasts,
  dismissToast,
}: {
  toasts: Toast[]
  dismissToast: (id: string) => void
}) {
  const iconForType = (type: ToastType) => {
    switch (type) {
      case 'success':
        return <Check className="text-green-600" size={24} strokeWidth={3} />
      case 'error':
        return <AlertCircle className="text-red-600" size={24} strokeWidth={3} />
      case 'warning':
        return <AlertCircle className="text-yellow-600" size={24} strokeWidth={3} />
      default:
        return <Info className="text-blue-600" size={24} strokeWidth={3} />
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 p-4 bg-white border-4 border-black shadow-nb min-w-[300px] animate-in slide-in-from-right"
        >
          {iconForType(toast.type)}
          <p className="font-bold uppercase text-sm flex-1">{toast.message}</p>
          <button
            type="button"
            className="text-xs font-black uppercase"
            onClick={() => dismissToast(toast.id)}
          >
            Close
          </button>
        </div>
      ))}
    </div>
  )
}
