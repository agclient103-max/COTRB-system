import { useEffect } from 'react'
import { createPortal } from 'react-dom'

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export default function Modal({ isOpen, onClose, title, children, footer, size = 'md' }) {
  // Esc closes the modal; body scroll is locked while it's open.
  useEffect(() => {
    if (!isOpen) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Dismiss dialog overlay"
        onClick={onClose}
        className="fixed inset-0 bg-ink-950/50"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={[
          'relative w-full rounded-2xl bg-white shadow-2xl',
          'max-h-[90vh] overflow-y-auto',
          SIZE_CLASSES[size],
        ].join(' ')}
      >
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="rounded-md p-1 text-ink-400 hover:bg-ink-50 hover:text-ink-700"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-5">{children}</div>

        {footer && (
          <div className="flex justify-end gap-3 border-t border-ink-100 px-6 py-4">{footer}</div>
        )}
      </div>
    </div>,
    document.body,
  )
}
