import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { useMinistries } from '../../hooks/useMinistries.js'
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

const CATEGORY_OPTIONS = ['Ministry Area', 'Fellowship', 'Affiliated Church']
const STATUS_OPTIONS = ['Active', 'Inactive']
const STATUS_TONE = { Active: 'success', Inactive: 'neutral' }
const CATEGORY_TONE = {
  'Ministry Area': 'brass',
  Fellowship: 'neutral',
  'Affiliated Church': 'success',
}
const EMPTY_FORM = {
  name: '',
  category: CATEGORY_OPTIONS[0],
  lead: '',
  memberCount: '',
  schedule: '',
  status: 'Active',
  notes: '',
}

export default function MinistryPage() {
  const { user } = useAuth()
  const canView = hasModuleAccess(user.role, 'ministry')
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = useMinistries({ enabled: canView })
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

  const canEdit = canUpdate(user.role, 'ministry')
  const canRemove = canDelete(user.role, 'ministry')

  function toStoredInput(values) {
    return { ...values, memberCount: values.memberCount === '' ? null : Number(values.memberCount) }
  }

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
      category: record.category,
      lead: record.lead === '— Not yet assigned —' ? '' : record.lead,
      memberCount: record.memberCount ?? '',
      schedule: record.schedule ?? '',
      status: record.status,
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
            description="Your role doesn't have access to Ministry. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'name', header: 'Ministry' },
    {
      key: 'category',
      header: 'Category',
      hideBelow: 'sm',
      render: (row) => (
        <Badge tone={CATEGORY_TONE[row.category] ?? 'neutral'}>{row.category}</Badge>
      ),
    },
    { key: 'lead', header: 'Lead / Coordinator', hideBelow: 'md' },
    {
      key: 'memberCount',
      header: 'Members',
      hideBelow: 'lg',
      render: (row) => (row.memberCount == null ? '—' : row.memberCount),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <Badge tone={STATUS_TONE[row.status] ?? 'neutral'}>{row.status}</Badge>,
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
        title="Ministry"
        count={filteredRecords.length}
        countLabel="ministry"
        countLabelPlural="ministries"
        moduleKey="ministry"
        addLabel="Add Ministry"
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
        emptyTitle="No ministries found"
        emptyDescription="Try a different search term or filter, or add a new ministry."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Ministry' : 'Add Ministry'}
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
            <label htmlFor="min-name" className="mb-1 block text-sm font-medium text-ink-700">
              Ministry name
            </label>
            <input
              id="min-name"
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Prayer & Intercession"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min-category" className="mb-1 block text-sm font-medium text-ink-700">
                Category
              </label>
              <select
                id="min-category"
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
              <label htmlFor="min-status" className="mb-1 block text-sm font-medium text-ink-700">
                Status
              </label>
              <select
                id="min-status"
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
            <label htmlFor="min-lead" className="mb-1 block text-sm font-medium text-ink-700">
              Lead / Coordinator
            </label>
            <input
              id="min-lead"
              type="text"
              value={formValues.lead}
              onChange={(e) => setFormValues((v) => ({ ...v, lead: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="optional"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="min-members" className="mb-1 block text-sm font-medium text-ink-700">
                Member count
              </label>
              <input
                id="min-members"
                type="number"
                min="0"
                value={formValues.memberCount}
                onChange={(e) => setFormValues((v) => ({ ...v, memberCount: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="optional"
              />
            </div>
            <div>
              <label htmlFor="min-schedule" className="mb-1 block text-sm font-medium text-ink-700">
                Schedule
              </label>
              <input
                id="min-schedule"
                type="text"
                value={formValues.schedule}
                onChange={(e) => setFormValues((v) => ({ ...v, schedule: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="e.g. Fridays"
              />
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Ministry details"
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
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Category
                </dt>
                <dd className="mt-0.5">
                  <Badge tone={CATEGORY_TONE[viewingRecord.category] ?? 'neutral'}>
                    {viewingRecord.category}
                  </Badge>
                </dd>
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
                Lead / Coordinator
              </dt>
              <dd className="mt-0.5 text-ink-800">{viewingRecord.lead}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Members
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.memberCount ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Schedule
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.schedule || '—'}</dd>
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
        title="Delete ministry"
        message={`This will permanently remove "${deletingRecord?.name ?? ''}" from Ministry. This cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
      <DuplicateWarningDialog
        isOpen={Boolean(duplicate)}
        onClose={() => setDuplicate(null)}
        existingLabel={duplicate ? duplicate.existing.name : ''}
        incomingLabel={duplicate ? duplicate.pendingValues.name : ''}
        onMerge={handleMerge}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  )
}
