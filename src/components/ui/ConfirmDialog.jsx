import Modal from './Modal.jsx'
import Button from './Button.jsx'
import ErrorBanner from './ErrorBanner.jsx'

/**
 * Deleting can fail just like saving can (§8.6) — this dialog carries its own error state,
 * separate from any Add/Edit modal's error state, and the caller is responsible for clearing
 * `error` when the dialog re-opens for a new record.
 */
export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = 'Delete record',
  message = 'This action cannot be undone. Are you sure you want to continue?',
  confirmLabel = 'Delete',
  isLoading = false,
  error = null,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} isLoading={isLoading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        {error && <ErrorBanner message={error} />}
        <p className="text-sm text-ink-600">{message}</p>
      </div>
    </Modal>
  )
}
