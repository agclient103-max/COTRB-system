import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { useFinancial } from '../../hooks/useFinancial.js'
import { MINISTRY_NAMES } from '../../data/ministries.js'
import { GIVING_STATS } from '../../data/dashboardMockData.js'
import { formatUgxCompact } from '../../utils/format.js'
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
import StatCard from '../../components/ui/StatCard.jsx'

const TYPE_OPTIONS = ['Income', 'Expense']
const CATEGORY_OPTIONS = [
  'Tithes & Offerings',
  'Special Offering',
  'Salaries & Wages',
  'Utilities',
  'Maintenance',
  'Mission & Outreach',
  'Ministry Supplies',
  'Office & Admin',
  'Other',
]
const STATUS_OPTIONS = ['Recorded', 'Pending Review', 'Approved']
const STATUS_TONE = { Recorded: 'neutral', 'Pending Review': 'warning', Approved: 'success' }

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

const EMPTY_FORM = {
  date: '',
  type: TYPE_OPTIONS[0],
  category: CATEGORY_OPTIONS[0],
  ministry: MINISTRY_NAMES[0],
  amount: '',
  description: '',
  status: 'Recorded',
  notes: '',
}

export default function FinancialPage() {
  const { user } = useAuth()
  const canView = hasModuleAccess(user.role, 'financial')
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = useFinancial({ enabled: canView })
  const [searchParams, setSearchParams] = useSearchParams()

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
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

  const canEdit = canUpdate(user.role, 'financial')
  const canRemove = canDelete(user.role, 'financial')

  const totals = useMemo(() => {
    const income = records.filter((r) => r.type === 'Income').reduce((sum, r) => sum + r.amount, 0)
    const expenses = records
      .filter((r) => r.type === 'Expense')
      .reduce((sum, r) => sum + r.amount, 0)
    return { income, expenses, net: income - expenses }
  }, [records])

  function openAddModal() {
    setFormError(null)
    setEditingId(null)
    setFormValues({ ...EMPTY_FORM, date: todayIso() })
    setIsFormOpen(true)
  }

  useEffect(() => {
    function openFromUrl() {
      setFormError(null)
      setEditingId(null)
      setFormValues({ ...EMPTY_FORM, date: todayIso() })
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
      const matchesSearch = r.description.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || r.type === typeFilter
      const matchesStatus = statusFilter === 'all' || r.status === statusFilter
      return matchesSearch && matchesType && matchesStatus
    })
  }, [records, search, typeFilter, statusFilter])

  function toStoredInput(values) {
    return { ...values, amount: values.amount === '' ? null : Number(values.amount) }
  }

  function openEditModal(record) {
    setFormError(null)
    setEditingId(record.localId)
    setFormValues({
      date: record.date,
      type: record.type,
      category: record.category,
      ministry: record.ministry,
      amount: record.amount,
      description: record.description,
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
            description="Your role doesn't have access to Financial. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'date', header: 'Date' },
    { key: 'description', header: 'Description' },
    { key: 'category', header: 'Category', hideBelow: 'md' },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span
          className={
            row.type === 'Income' ? 'font-medium text-emerald-700' : 'font-medium text-red-700'
          }
        >
          {row.type === 'Income' ? '+' : '-'}
          {formatUgxCompact(row.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      hideBelow: 'lg',
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
        title="Financial"
        count={filteredRecords.length}
        countLabel="transaction"
        moduleKey="financial"
        addLabel="Add Transaction"
        onAdd={openAddModal}
      />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Income (recorded)" value={formatUgxCompact(totals.income)} tone="brass" />
        <StatCard label="Expenses (recorded)" value={formatUgxCompact(totals.expenses)} />
        <StatCard
          label="Net (recorded)"
          value={`${totals.net >= 0 ? '+' : ''}${formatUgxCompact(totals.net)}`}
        />
        <StatCard
          label="2026 Budget Used (YTD)"
          value={`${GIVING_STATS.percentOfBudgetYtd}%`}
          sublabel={`${formatUgxCompact(GIVING_STATS.ytdTotal)} of ${formatUgxCompact(GIVING_STATS.annualBudget)}`}
        />
      </div>
      {loadError && <ErrorBanner message={loadError} />}
      <SearchFilterBar
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by description…"
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
        emptyTitle="No transactions found"
        emptyDescription="Try a different search term or filter, or add a new transaction."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Transaction' : 'Add Transaction'}
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
            <label
              htmlFor="fin-description"
              className="mb-1 block text-sm font-medium text-ink-700"
            >
              Description
            </label>
            <input
              id="fin-description"
              type="text"
              value={formValues.description}
              onChange={(e) => setFormValues((v) => ({ ...v, description: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Sunday Tithes & Offerings"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fin-date" className="mb-1 block text-sm font-medium text-ink-700">
                Date
              </label>
              <input
                id="fin-date"
                type="date"
                value={formValues.date}
                onChange={(e) => setFormValues((v) => ({ ...v, date: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              />
            </div>
            <div>
              <label htmlFor="fin-amount" className="mb-1 block text-sm font-medium text-ink-700">
                Amount (UGX)
              </label>
              <input
                id="fin-amount"
                type="number"
                min="0"
                value={formValues.amount}
                onChange={(e) => setFormValues((v) => ({ ...v, amount: e.target.value }))}
                className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
                placeholder="e.g. 250000"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fin-type" className="mb-1 block text-sm font-medium text-ink-700">
                Type
              </label>
              <select
                id="fin-type"
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
              <label htmlFor="fin-status" className="mb-1 block text-sm font-medium text-ink-700">
                Status
              </label>
              <select
                id="fin-status"
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="fin-category" className="mb-1 block text-sm font-medium text-ink-700">
                Category
              </label>
              <select
                id="fin-category"
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
              <label htmlFor="fin-ministry" className="mb-1 block text-sm font-medium text-ink-700">
                Ministry
              </label>
              <select
                id="fin-ministry"
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
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Transaction details"
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
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                Description
              </dt>
              <dd className="mt-0.5 text-ink-800">{viewingRecord.description}</dd>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">Date</dt>
                <dd className="mt-0.5 text-ink-800">{viewingRecord.date}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Amount
                </dt>
                <dd
                  className={
                    viewingRecord.type === 'Income'
                      ? 'mt-0.5 font-medium text-emerald-700'
                      : 'mt-0.5 font-medium text-red-700'
                  }
                >
                  {viewingRecord.type === 'Income' ? '+' : '-'}
                  {formatUgxCompact(viewingRecord.amount)}
                </dd>
              </div>
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
        title="Delete transaction"
        message={`This will permanently remove "${deletingRecord?.description ?? ''}" from Financial. This cannot be undone.`}
        isLoading={isDeleting}
        error={deleteError}
      />
      <DuplicateWarningDialog
        isOpen={Boolean(duplicate)}
        onClose={() => setDuplicate(null)}
        existingLabel={
          duplicate ? `${duplicate.existing.description} (${duplicate.existing.date})` : ''
        }
        incomingLabel={
          duplicate
            ? `${duplicate.pendingValues.description} (${duplicate.pendingValues.date})`
            : ''
        }
        onMerge={handleMerge}
        onKeepBoth={handleKeepBoth}
      />
    </div>
  )
}
