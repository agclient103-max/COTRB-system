import { createPortal } from 'react-dom'
import { useToast } from '../../hooks/useToast.js'

const TONE_CLASSES = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  error: 'border-red-200 bg-red-50 text-red-800',
  info: 'border-ink-200 bg-white text-ink-800',
}

export default function ToastViewport() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[60] flex w-full max-w-sm flex-col gap-2 sm:bottom-6 sm:right-6">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={[
            'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm shadow-lg',
            TONE_CLASSES[toast.tone] ?? TONE_CLASSES.info,
          ].join(' ')}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            type="button"
            onClick={() => dismiss(toast.id)}
            aria-label="Dismiss notification"
            className="flex-none opacity-60 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>,
    document.body,
  )
}
