import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import { canUpdate, canDelete, hasModuleAccess } from '../../data/roles.js'
import { useReports } from '../../hooks/useReports.js'
import { api } from '../../api/client.js'
import { MEMBERSHIP_STATS } from '../../data/dashboardMockData.js'
import { formatNumber, formatUgxCompact } from '../../utils/format.js'
import PageHeader from '../../components/ui/PageHeader.jsx'
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

const TYPE_OPTIONS = ['Membership Summary', 'Ministry Activity', 'Giving Summary']
const TYPE_TONE = {
  'Membership Summary': 'brass',
  'Ministry Activity': 'success',
  'Giving Summary': 'warning',
}
const EMPTY_FORM = { name: '', type: TYPE_OPTIONS[0], notes: '' }

function BarRow({ label, value, max }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-ink-600">
        <span className="truncate">{label}</span>
        <span className="flex-none font-medium text-ink-800">{value}</span>
      </div>
      <div className="h-2 rounded-full bg-ink-50">
        <div className="h-2 rounded-full bg-brass-500" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export default function ReportsPage() {
  const { user } = useAuth()
  const canView = hasModuleAccess(user.role, 'reports')
  const {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  } = useReports({ enabled: canView })

  // `summary` is a live, server-computed cross-module aggregate — it's not
  // meaningful to cache offline, so it's fetched directly here rather than
  // through the offline-aware record store.
  const [summary, setSummary] = useState(null)
  const [summaryError, setSummaryError] = useState(null)

  useEffect(() => {
    if (!canView) return undefined
    let cancelled = false
    async function loadSummary() {
      try {
        const body = await api.get('/api/reports')
        if (!cancelled) setSummary(body.summary)
      } catch {
        if (!cancelled) {
          setSummaryError('Could not load live statistics — you may be offline.')
        }
      }
    }
    loadSummary()
    return () => {
      cancelled = true
    }
  }, [canView])

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

  const canEdit = canUpdate(user.role, 'reports')
  const canRemove = canDelete(user.role, 'reports')

  function openAddModal() {
    setFormError(null)
    setEditingId(null)
    setFormValues({ ...EMPTY_FORM, createdBy: user.name })
    setIsFormOpen(true)
  }

  function openEditModal(record) {
    setFormError(null)
    setEditingId(record.localId)
    setFormValues({
      name: record.name,
      type: record.type,
      createdBy: record.createdBy,
      notes: record.notes ?? '',
    })
    setIsFormOpen(true)
  }

  async function handleSave() {
    setIsSaving(true)
    setFormError(null)
    const input = { ...formValues, createdBy: formValues.createdBy ?? user.name }
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
            description="Your role doesn't have access to Reports & Analytics. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  const columns = [
    { key: 'name', header: 'Report' },
    {
      key: 'type',
      header: 'Type',
      hideBelow: 'sm',
      render: (row) => <Badge tone={TYPE_TONE[row.type] ?? 'neutral'}>{row.type}</Badge>,
    },
    { key: 'createdBy', header: 'Created by', hideBelow: 'md' },
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
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Reports &amp; Analytics
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          Church-wide Analytics
        </h1>
      </div>
      {loadError && <ErrorBanner message={loadError} />}
      {summaryError && <ErrorBanner message={summaryError} className="mt-2" />}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Members"
          value={formatNumber(MEMBERSHIP_STATS.totalMembers)}
          sublabel="Reported total"
        />
        <StatCard
          label="Personnel Records"
          value={formatNumber(summary?.personnelCount ?? 0)}
          sublabel="Live from Personnel"
        />
        <StatCard
          label="Ministries"
          value={formatNumber(summary?.ministryCount ?? 0)}
          sublabel="Live from Ministry"
        />
        <StatCard
          label="Net (recorded transactions)"
          value={`${(summary?.financialTotals?.net ?? 0) >= 0 ? '+' : ''}${formatUgxCompact(summary?.financialTotals?.net ?? 0)}`}
          sublabel="Live from Financial"
          tone="brass"
        />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">
            Ministries by size (top 6, with a known member count)
          </h2>
          {!summary?.topMinistries || summary.topMinistries.length === 0 ? (
            <p className="text-xs text-ink-400">No ministries with a recorded member count yet.</p>
          ) : (
            <div className="space-y-3">
              {summary.topMinistries.map((m) => (
                <BarRow
                  key={m.name}
                  label={m.name}
                  value={m.memberCount}
                  max={summary.topMinistries[0].memberCount}
                />
              ))}
            </div>
          )}
        </div>
        <div className="rounded-xl border border-ink-100 bg-white p-5">
          <h2 className="mb-4 font-display text-base font-semibold text-ink-900">
            Personnel by category
          </h2>
          <div className="space-y-3">
            {(summary?.personnelByCategory ?? []).map((row) => (
              <BarRow
                key={row.category}
                label={row.category}
                value={row.count}
                max={Math.max(...(summary?.personnelByCategory ?? []).map((r) => r.count), 1)}
              />
            ))}
          </div>
        </div>
      </div>
      <div>
        <PageHeader
          title="Saved Reports"
          count={records.length}
          countLabel="saved report"
          moduleKey="reports"
          addLabel="Add Report"
          onAdd={openAddModal}
        />
        <div className="mt-4">
          <Table
            columns={columns}
            rows={records}
            rowKey={(row) => row.localId}
            isLoading={isLoading}
            emptyTitle="No saved reports yet"
            emptyDescription="Save a report definition to quickly regenerate it later."
          />
        </div>
      </div>

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={editingId ? 'Edit Report' : 'Add Report'}
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
            <label htmlFor="rpt-name" className="mb-1 block text-sm font-medium text-ink-700">
              Report name
            </label>
            <input
              id="rpt-name"
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. September 2026 Giving Summary"
            />
          </div>
          <div>
            <label htmlFor="rpt-type" className="mb-1 block text-sm font-medium text-ink-700">
              Type
            </label>
            <select
              id="rpt-type"
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
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(viewingRecord)}
        onClose={() => setViewingRecord(null)}
        title="Report"
        size="lg"
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
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">
                {viewingRecord.type} · Created by {viewingRecord.createdBy}
              </p>
              <h3 className="mt-1 font-display text-lg font-semibold text-ink-900">
                {viewingRecord.name}
              </h3>
            </div>
            {viewingRecord.type === 'Membership Summary' && (
              <div className="space-y-2">
                {(summary?.personnelByCategory ?? []).map((row) => (
                  <div
                    key={row.category}
                    className="flex justify-between border-b border-ink-100 py-1.5"
                  >
                    <span className="text-ink-600">{row.category}</span>
                    <span className="font-medium text-ink-900">{row.count}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-2 text-ink-900">
                  <span className="font-semibold">Total personnel records</span>
                  <span className="font-semibold">{summary?.personnelCount ?? 0}</span>
                </div>
              </div>
            )}
            {viewingRecord.type === 'Ministry Activity' && (
              <div className="space-y-2">
                {(summary?.topMinistries ?? []).map((m) => (
                  <div key={m.name} className="flex justify-between border-b border-ink-100 py-1.5">
                    <span className="text-ink-600">{m.name}</span>
                    <span className="font-medium text-ink-900">{m.memberCount ?? '—'}</span>
                  </div>
                ))}
                <p className="pt-1 text-xs text-ink-400">
                  Showing the top ministries by recorded member count.
                </p>
              </div>
            )}
            {viewingRecord.type === 'Giving Summary' && (
              <div className="space-y-2">
                <div className="flex justify-between border-b border-ink-100 py-1.5">
                  <span className="text-ink-600">Total income (recorded)</span>
                  <span className="font-medium text-emerald-700">
                    {formatUgxCompact(summary?.financialTotals?.income ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between border-b border-ink-100 py-1.5">
                  <span className="text-ink-600">Total expenses (recorded)</span>
                  <span className="font-medium text-red-700">
                    {formatUgxCompact(summary?.financialTotals?.expenses ?? 0)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-ink-900">
                  <span className="font-semibold">Net</span>
                  <span className="font-semibold">
                    {formatUgxCompact(summary?.financialTotals?.net ?? 0)}
                  </span>
                </div>
              </div>
            )}
            <p className="text-xs text-ink-400">
              Generated live from current module data. Numbers reflect the transaction/ministry
              records currently stored, not final audited figures.
            </p>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingRecord)}
        onClose={() => setDeletingRecord(null)}
        onConfirm={handleConfirmDelete}
        title="Delete report"
        message={`This will permanently remove "${deletingRecord?.name ?? ''}" from Saved Reports. This cannot be undone.`}
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
