import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { usePersonnel } from '../../hooks/usePersonnel.js'
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

const CATEGORY_OPTIONS = ['Clergy', 'Council', 'Coordinator', 'Staff']
const STATUS_OPTIONS = ['Active', 'On Leave', 'Vacant', 'Inactive']
const STATUS_TONE = {
  Active: 'success',
  'On Leave': 'warning',
  Vacant: 'neutral',
  Inactive: 'danger',
}
const EMPTY_FORM = {
  name: '',
  title: '',
  category: CATEGORY_OPTIONS[0],
  ministry: MINISTRY_NAMES[0],
  status: 'Active',
  email: '',
  phone: '',
  notes: '',
}

export default function PersonnelPage() {
  const { user } = useAuth()
  const canView = hasModuleAccess(user.role, 'personnel')
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = usePersonnel({ enabled: canView })
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [formValues, setFormValues] = useState(EMPTY_FORM)
  const [formError, setFormError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)
  const [viewingRecord, setViewingRecord] = useState(null)
  const [deletingRecord, setDeletingRecord] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [duplicate, setDuplicate] = useState(null)

  const canEdit = canUpdate(user.role, 'personnel')
  const canRemove = canDelete(user.role, 'personnel')

  function openAddModal() {
    setFormError(null)
    setEditingId(null)
    setFormValues(EMPTY_FORM)
    setIsFormOpen(true)
  }

  useEffect(() => {
    function openFromUrl() {
      setFormError(null)
      setEditingId(null)
      setFormValues(EMPTY_FORM)
      setIsFormOpen(true)
    }
    if (searchParams.get('action') === 'add' && canView) {
      openFromUrl()
      const next = new URLSearchParams(searchParams)
      next.delete('action')
      setSearchParams(next, { replace: true })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      const matchesSearch = r.name.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [records, search, categoryFilter, statusFilter])

  function openEditModal(record) {
    setFormError(null)
    setEditingId(record.localId)
    setFormValues({
      name: record.name,
      title: record.title,
      category: record.category,
      ministry: record.ministry,
      status: record.status,
      email: record.email ?? '',
      phone: record.phone ?? '',
      notes: record.notes ?? '',
    })
    setIsFormOpen(true)
  }

  async function handleSave() {
    setIsSaving(true)
    setFormError(null)
    const result = editingId
      ? await updateRecord(editingId, formValues)
      : await addRecord(formValues)
    setIsSaving(false)
    if (result.status === 'error') {
      setFormError(result.message)
      return
    }
    if (result.status === 'duplicate') {
      setDuplicate({ existing: result.existing, pendingValues: formValues, editingId })
      return
    }
    setIsFormOpen(false)
  }

  async function handleMerge() {
    if (!duplicate) return
    const result = await mergeIntoExisting(duplicate.existing.localId, duplicate.pendingValues)
    if (result.status === 'error') setFormError(result.message)
    else setIsFormOpen(false)
    setDuplicate(null)
  }

  async function handleKeepBoth() {
    if (!duplicate) return
    const result = duplicate.editingId
      ? await updateRecord(duplicate.editingId, duplicate.pendingValues, {
          skipDuplicateCheck: true,
        })
      : await addRecord(duplicate.pendingValues, { skipDuplicateCheck: true })
    if (result.status === 'error') setFormError(result.message)
    else setIsFormOpen(false)
    setDuplicate(null)
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
            description="Your role doesn't have access to Personnel. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'name', header: 'Name' },
    { key: 'title', header: 'Role', hideBelow: 'sm' },
    { key: 'ministry', header: 'Ministry', hideBelow: 'md' },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>,
    },
    {
      key: 'number',
      header: 'Record #',
      hideBelow: 'lg',
      render: (row) => <RecordNumberBadge record={row} />,
    },
    {
      key: 'actions',
      header: '',
      render: (row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="ghost" onClick={() => setViewingRecord(row)}>
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
        title="Personnel"
        count={filteredRecords.length}
        countLabel="person"
        countLabelPlural="people"
        moduleKey="personnel"
        addLabel="Add Person"
        onAdd={openAddModal}
      />
      {loadError && <ErrorBanner message={loadError} />}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name…"
        filters={[
          {
            key: 'category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            options: [
              { value: 'all', label: 'All categories' },
              ...CATEGORY_OPTIONS.map((c) => ({ value: c, label: c })),
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
        emptyTitle="No people found"
        emptyDescription="Try a different search term or filter, or add a new person."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Person' : 'Add Person'}
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
            <label htmlFor="per-name" className="mb-1 block text-sm font-medium text-ink-700">
              Full name
            </label>
            <input
              id="per-name"
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Rev. Jane Doe"
            />
          </div>
          <div>
            <label htmlFor="per-title" className="mb-1 block text-sm font-medium text-ink-700">
              Role / title
            </label>
            <input
              id="per-title"
              type="text"
              value={formValues.title}
              onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Ministry Coordinator"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="per-category" className="mb-1 block text-sm font-medium text-ink-700">
                Category
              </label>
              <select
                id="per-category"
                value={formValues.category}
                onChange={(e) => setFormValues((v) => ({ ...v, category: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              >
                {CATEGORY_OPTIONS.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="per-status" className="mb-1 block text-sm font-medium text-ink-700">
                Status
              </label>
              <select
                id="per-status"
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
            <label htmlFor="per-ministry" className="mb-1 block text-sm font-medium text-ink-700">
              Ministry
            </label>
            <select
              id="per-ministry"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="per-email" className="mb-1 block text-sm font-medium text-ink-700">
                Email
              </label>
              <input
                id="per-email"
                type="email"
                value={formValues.email}
                onChange={(e) => setFormValues((v) => ({ ...v, email: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="optional"
              />
            </div>
            <div>
              <label htmlFor="per-phone" className="mb-1 block text-sm font-medium text-ink-700">
                Phone
              </label>
              <input
                id="per-phone"
                type="tel"
                value={formValues.phone}
                onChange={(e) => setFormValues((v) => ({ ...v, phone: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="optional"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Person details"
        footer={
          <>
            <Button variant="secondary" onClick={() => window.print()}>
              Print
            </Button>
            <Button onClick={() => setViewingRecord(null)}>Close</Button>
          </>
        }
      >
        {viewingRecord && (
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Name</dt>
              <dd className="mt-0.5 text-ink-800">{viewingRecord.name}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Role</dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.title}</dd>
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Ministry
              </dt>
              <dd className="mt-0.5 text-ink-800">{viewingRecord.ministry}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Email
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.email || '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Phone
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.phone || '—'}</dd>
              </div>
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
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        title="Delete person"
        message={`This will permanently remove "${deletingRecord?.name ?? ''}" from Personnel. This cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
      <DuplicateWarningDialog
        isOpen={Boolean(duplicate)}
        onClose={() => setDuplicate(null)}
        existingLabel={duplicate ? `${duplicate.existing.name} — ${duplicate.existing.title}` : ''}
        incomingLabel={
          duplicate ? `${duplicate.pendingValues.name} — ${duplicate.pendingValues.title}` : ''
        }
        onMerge={handleMerge}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  )
}
