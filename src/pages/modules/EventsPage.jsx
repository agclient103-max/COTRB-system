import { useMemo, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { useEvents } from '../../hooks/useEvents.js'
import { MINISTRY_NAMES } from '../../data/ministries.js'
import PageHeader from '../../components/ui/PageHeader.jsx'
import SearchFilterBar from '../../components/ui/SearchFilterBar.jsx'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import RecordNumberBadge from '../../components/ui/RecordNumberBadge.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ErrorBanner from '../../components/ui/ErrorBanner.jsx'
import Button from '../../components/ui/Button.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import DuplicateWarningDialog from '../../components/ui/DuplicateWarningDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'

const TYPE_OPTIONS = [
  'Service',
  'Meeting',
  'Conference',
  'Confirmation',
  'Baptism',
  'Wedding',
  'Other',
]
const STATUS_OPTIONS = ['Upcoming', 'Recurring', 'Completed', 'Cancelled']

const STATUS_TONE = {
  Upcoming: 'brass',
  Recurring: 'neutral',
  Completed: 'success',
  Cancelled: 'danger',
}

const EMPTY_FORM = {
  title: '',
  type: TYPE_OPTIONS[0],
  ministry: MINISTRY_NAMES[0],
  when: '',
  status: 'Upcoming',
  capacity: '',
  notes: '',
}

export default function EventsPage() {
  const { user } = useAuth()
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = useEvents()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [viewingId, setViewingId] = useState(null)
  const [viewError, setViewError] = useState(null)
  const [attendeeName, setAttendeeName] = useState('')

  const [deletingRecord, setDeletingRecord] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [duplicate, setDuplicate] = useState(null)

  const canEdit = canUpdate(user.role, 'events')
  const canRemove = canDelete(user.role, 'events')
  const canView = hasModuleAccess(user.role, 'events')

  // Derived from `records` (not a stale snapshot) so the view modal stays in sync while
  // attendees are added/removed with the modal still open.
  const viewingRecord = records.find((r) => r.localId === viewingId) ?? null

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || r.type === typeFilter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [records, search, typeFilter, statusFilter])

  function toStoredInput(values) {
    return {
      ...values,
      capacity: values.capacity === '' ? null : Number(values.capacity),
    }
  }

  function openAddModal() {
    setFormError(null)
    setEditingId(null)
    setFormValues(EMPTY_FORM)
    setIsFormOpen(true)
  }

  function openEditModal(record) {
    setFormError(null)
    setEditingId(record.localId)
    setFormValues({
      title: record.title,
      type: record.type,
      ministry: record.ministry,
      when: record.when,
      status: record.status,
      capacity: record.capacity ?? '',
      notes: record.notes ?? '',
    })
    setIsFormOpen(true)
  }

  async function handleSave() {
    setIsSaving(true)
    setFormError(null)
    const input = toStoredInput(formValues)
    const result = editingId ? await updateRecord(editingId, input) : await addRecord(input)
    setIsSaving(false)

    if (result.status === 'error') {
      setFormError(result.message)
      return
    }
    if (result.status === 'duplicate') {
      setDuplicate({ existing: result.existing, pendingValues: input, editingId })
      return
    }
    setIsFormOpen(false)
  }

  async function handleMerge() {
    if (!duplicate) return
    const result = await mergeIntoExisting(duplicate.existing.localId, duplicate.pendingValues)
    if (result.status === 'error') {
      setFormError(result.message)
    } else {
      setIsFormOpen(false)
    }
    setDuplicate(null)
  }

  async function handleKeepBoth() {
    if (!duplicate) return
    const result = duplicate.editingId
      ? await updateRecord(duplicate.editingId, duplicate.pendingValues)
      : await addRecord(duplicate.pendingValues, { skipDuplicateCheck: true })
    if (result.status === 'error') {
      setFormError(result.message)
    } else {
      setIsFormOpen(false)
    }
    setDuplicate(null)
  }

  function openView(record) {
    setViewError(null)
    setAttendeeName('')
    setViewingId(record.localId)
  }

  function fullInputFor(record) {
    return {
      title: record.title,
      type: record.type,
      ministry: record.ministry,
      when: record.when,
      status: record.status,
      capacity: record.capacity,
      notes: record.notes,
      attendees: record.attendees,
    }
  }

  async function handleAddAttendee() {
    if (!viewingRecord || !attendeeName.trim()) return
    const updated = [...viewingRecord.attendees, attendeeName.trim()]
    const result = await updateRecord(viewingRecord.localId, {
      ...fullInputFor(viewingRecord),
      attendees: updated,
    })
    if (result.status === 'error') {
      setViewError(result.message)
    } else {
      setAttendeeName('')
    }
  }

  async function handleRemoveAttendee(name) {
    if (!viewingRecord) return
    const updated = viewingRecord.attendees.filter((a) => a !== name)
    const result = await updateRecord(viewingRecord.localId, {
      ...fullInputFor(viewingRecord),
      attendees: updated,
    })
    if (result.status === 'error') {
      setViewError(result.message)
    }
  }

  function openDeleteConfirm(record) {
    setDeleteError(null)
    setDeletingRecord(record)
  }

  async function handleConfirmDelete() {
    if (!deletingRecord) return
    setIsDeleting(true)
    const result = await removeRecord(deletingRecord.localId)
    setIsDeleting(false)
    if (result.status === 'error') {
      setDeleteError(result.message)
      return
    }
    setDeletingRecord(null)
  }

  if (!canView) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <EmptyState
            title="Access restricted"
            description="Your role doesn't have access to Events & Calendar. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'title', header: 'Event' },
    { key: 'type', header: 'Type', hideBelow: 'sm' },
    { key: 'when', header: 'When', hideBelow: 'md' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'rsvp',
      header: 'RSVPs',
      hideBelow: 'lg',
      render: (row) => `${row.attendees.length}${row.capacity ? ` / ${row.capacity}` : ''}`,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => openView(row)}>
            View
          </Button>
          {canEdit && (
            <Button size="sm" variant="ghost" onClick={() => openEditModal(row)}>
              Edit
            </Button>
          )}
          {canRemove && (
            <Button size="sm" variant="ghost" onClick={() => openDeleteConfirm(row)}>
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader
        title="Events & Calendar"
        count={filteredRecords.length}
        countLabel="event"
        moduleKey="events"
        addLabel="Add Event"
        onAdd={openAddModal}
      />

      {loadError && <ErrorBanner message={loadError} />}

      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title…"
        filters={[
          {
            key: 'type',
            value: typeFilter,
            onChange: setTypeFilter,
            options: [
              { value: 'all', label: 'All types' },
              ...TYPE_OPTIONS.map((t) => ({ value: t, label: t })),
            ],
          },
          {
            key: 'status',
            value: statusFilter,
            onChange: setStatusFilter,
            options: [
              { value: 'all', label: 'All statuses' },
              ...STATUS_OPTIONS.map((s) => ({ value: s, label: s })),
            ],
          },
        ]}
      />

      <Table
        columns={columns}
        rows={filteredRecords}
        rowKey={(row) => row.localId}
        isLoading={isLoading}
        emptyTitle="No events found"
        emptyDescription="Try a different search term or filter, or add a new event."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Event' : 'Add Event'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={isSaving}>
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}

          <div>
            <label htmlFor="evt-title" className="mb-1 block text-sm font-medium text-ink-700">
              Title
            </label>
            <input
              id="evt-title"
              type="text"
              value={formValues.title}
              onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Youth Ministry Retreat"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="evt-type" className="mb-1 block text-sm font-medium text-ink-700">
                Type
              </label>
              <select
                id="evt-type"
                value={formValues.type}
                onChange={(e) => setFormValues((v) => ({ ...v, type: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              >
                {TYPE_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="evt-status" className="mb-1 block text-sm font-medium text-ink-700">
                Status
              </label>
              <select
                id="evt-status"
                value={formValues.status}
                onChange={(e) => setFormValues((v) => ({ ...v, status: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="evt-ministry" className="mb-1 block text-sm font-medium text-ink-700">
              Ministry
            </label>
            <select
              id="evt-ministry"
              value={formValues.ministry}
              onChange={(e) => setFormValues((v) => ({ ...v, ministry: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
            >
              {MINISTRY_NAMES.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="evt-when" className="mb-1 block text-sm font-medium text-ink-700">
                When
              </label>
              <input
                id="evt-when"
                type="text"
                value={formValues.when}
                onChange={(e) => setFormValues((v) => ({ ...v, when: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="e.g. Every Sunday, 9:30am"
              />
            </div>
            <div>
              <label htmlFor="evt-capacity" className="mb-1 block text-sm font-medium text-ink-700">
                Capacity
              </label>
              <input
                id="evt-capacity"
                type="number"
                min="0"
                value={formValues.capacity}
                onChange={(e) => setFormValues((v) => ({ ...v, capacity: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="optional"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingId(null)}
        title="Event details"
        footer={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button onClick={() => setViewingId(null)}>Close</Button>
          </>
        }
      >
        {viewingRecord && (
          <div className="space-y-4 text-sm">
            {viewError && <ErrorBanner message={viewError} onDismiss={() => setViewError(null)} />}
            <dl className="space-y-3">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Title
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.title}</dd>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Type
                  </dt>
                  <dd className="mt-0.5 text-ink-800">{viewingRecord.type}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                    Status
                  </dt>
                  <dd className="mt-0.5">
                    <Badge tone={STATUS_TONE[viewingRecord.status] ?? 'neutral'}>
                      {viewingRecord.status}
                    </Badge>
                  </dd>
                </div>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">When</dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.when}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Ministry
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.ministry}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Record number
                </dt>
                <dd className="mt-0.5">
                  <RecordNumberBadge record={viewingRecord} />
                </dd>
              </div>
            </dl>

            <div className="border-t border-ink-100 pt-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                RSVPs / Attendees ({viewingRecord.attendees.length}
                {viewingRecord.capacity ? ` of ${viewingRecord.capacity}` : ''})
              </p>
              {viewingRecord.attendees.length === 0 ? (
                <p className="text-xs text-ink-400">No attendees recorded yet.</p>
              ) : (
                <ul className="mb-3 space-y-1.5">
                  {viewingRecord.attendees.map((name) => (
                    <li
                      key={name}
                      className="flex items-center justify-between rounded-md bg-ink-50/60 px-3 py-1.5"
                    >
                      <span className="text-ink-700">{name}</span>
                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveAttendee(name)}
                          aria-label={`Remove ${name} from attendees`}
                          className="text-ink-400 hover:text-red-600"
                        >
                          ✕
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canEdit && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={attendeeName}
                    onChange={(e) => setAttendeeName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAttendee()
                      }
                    }}
                    placeholder="Add attendee name"
                    aria-label="Add attendee name"
                    className="flex-1 rounded-lg border border-ink-200 px-3 py-1.5 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                  />
                  <Button size="sm" onClick={handleAddAttendee}>
                    Add
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        title="Delete event"
        message={`This will permanently remove "${deletingRecord?.title ?? ''}" from Events & Calendar. This cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />

      <DuplicateWarningDialog
        isOpen={Boolean(duplicate)}
        onClose={() => setDuplicate(null)}
        existingLabel={duplicate ? duplicate.existing.title : ''}
        incomingLabel={duplicate ? duplicate.pendingValues.title : ''}
        onMerge={handleMerge}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  )
}
