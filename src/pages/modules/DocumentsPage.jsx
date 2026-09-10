import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { useDocuments } from '../../hooks/useDocuments.js'
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

const CATEGORY_OPTIONS = [
  'Financial',
  'Meeting Minutes',
  'Report',
  'Register',
  'Proposal',
  'Planning',
  'Policy',
]
const STATUS_OPTIONS = ['Draft', 'Pending Approval', 'Approved', 'Archived']

const STATUS_TONE = {
  Draft: 'neutral',
  'Pending Approval': 'warning',
  Approved: 'success',
  Archived: 'brass',
}

const EMPTY_FORM = {
  title: '',
  category: CATEGORY_OPTIONS[0],
  ministry: MINISTRY_NAMES[0],
  status: 'Draft',
  notes: '',
}

export default function DocumentsPage() {
  const { user } = useAuth()
  const canView = hasModuleAccess(user.role, 'documents')
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = useDocuments({ enabled: canView })
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

  const canEdit = canUpdate(user.role, 'documents')
  const canRemove = canDelete(user.role, 'documents')

  function openAddModal() {
    setFormError(null)
    setEditingId(null)
    setFormValues(EMPTY_FORM)
    setIsFormOpen(true)
  }

  // Supports Dashboard "quick add" links like /documents?action=add — opens the Add
  // modal automatically, then clears the param so it doesn't reopen on back/refresh.
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
      const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase())
      const matchesCategory = categoryFilter === 'all' || r.category === categoryFilter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesCategory && matchesStatus
    })
  }, [records, search, categoryFilter, statusFilter])

  function openEditModal(record) {
    setFormError(null)
    setEditingId(record.localId)
    setFormValues({
      title: record.title,
      category: record.category,
      ministry: record.ministry,
      status: record.status,
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
      ? await updateRecord(duplicate.editingId, duplicate.pendingValues, {
          skipDuplicateCheck: true,
        })
      : await addRecord(duplicate.pendingValues, { skipDuplicateCheck: true })
    if (result.status === 'error') {
      setFormError(result.message)
    } else {
      setIsFormOpen(false)
    }
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
            description="Your role doesn't have access to Documents. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'title', header: 'Title' },
    { key: 'category', header: 'Category', hideBelow: 'sm' },
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
        title="Documents"
        count={filteredRecords.length}
        countLabel="document"
        moduleKey="documents"
        addLabel="Add Document"
        onAdd={openAddModal}
      />
      {loadError && <ErrorBanner message={loadError} />}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by title…"
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
        emptyTitle="No documents found"
        emptyDescription="Try a different search term or filter, or add a new document."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Document' : 'Add Document'}
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
            <label htmlFor="doc-title" className="mb-1 block text-sm font-medium text-ink-700">
              Title
            </label>
            <input
              id="doc-title"
              type="text"
              value={formValues.title}
              onChange={(e) => setFormValues((v) => ({ ...v, title: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Parish Council Meeting Minutes — June 2026"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="doc-category" className="mb-1 block text-sm font-medium text-ink-700">
                Category
              </label>
              <select
                id="doc-category"
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
              <label htmlFor="doc-status" className="mb-1 block text-sm font-medium text-ink-700">
                Status
              </label>
              <select
                id="doc-status"
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
            <label htmlFor="doc-ministry" className="mb-1 block text-sm font-medium text-ink-700">
              Ministry
            </label>
            <select
              id="doc-ministry"
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
          <div>
            <label htmlFor="doc-file" className="mb-1 block text-sm font-medium text-ink-700">
              File
            </label>
            <input
              id="doc-file"
              type="file"
              disabled
              className="w-full rounded-lg border border-dashed border-ink-200 px-3 py-2 text-sm text-ink-400"
            />
            <p className="mt-1 text-xs text-ink-400">
              File upload is enabled once cloud storage is connected in the backend phase — this
              module currently manages document records and metadata only.
            </p>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Document details"
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Title</dt>
              <dd className="mt-0.5 text-ink-800">{viewingRecord.title}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Category
                </dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.category}</dd>
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
        title="Delete document"
        message={`This will permanently remove "${deletingRecord?.title ?? ''}" from Documents. This cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
      <DuplicateWarningDialog
        isOpen={Boolean(duplicate)}
        onClose={() => setDuplicate(null)}
        existingLabel={
          duplicate ? `${duplicate.existing.title} (${duplicate.existing.ministry})` : ''
        }
        incomingLabel={
          duplicate ? `${duplicate.pendingValues.title} (${duplicate.pendingValues.ministry})` : ''
        }
        onMerge={handleMerge}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  )
}
