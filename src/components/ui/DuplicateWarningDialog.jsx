import Modal from './Modal.jsx'
import Button from './Button.jsx'

export default function DuplicateWarningDialog({
  isOpen,
  onClose,
  existingLabel,
  incomingLabel,
  onMerge,
  onKeepBoth,
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Possible duplicate found"
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="secondary" onClick={onKeepBoth}>
            Keep both
          </Button>
          <Button variant="brass" onClick={onMerge}>
            Merge into existing
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-sm text-ink-600">
        <p>
          A very similar record already exists. This can happen when the same person or
          document&rsquo;s details are entered separately by two different people.
        </p>
        <div className="rounded-lg border border-ink-100 bg-ink-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Existing record
          </p>
          <p className="mt-1 font-medium text-ink-800">{existingLabel}</p>
        </div>
        <div className="rounded-lg border border-brass-200 bg-brass-50/60 p-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-brass-600">
            What you&rsquo;re entering
          </p>
          <p className="mt-1 font-medium text-ink-800">{incomingLabel}</p>
        </div>
        <p className="text-xs text-ink-400">
          Merging replaces the existing record&rsquo;s details with what you just entered. Keeping
          both saves this as a separate record — use that only if they&rsquo;re genuinely different.
        </p>
      </div>
    </Modal>
  )
}
