import { useState } from 'react'
import Button from '../../components/ui/Button.jsx'
import Badge from '../../components/ui/Badge.jsx'
import ErrorBanner from '../../components/ui/ErrorBanner.jsx'
import Modal from '../../components/ui/Modal.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import Table from '../../components/ui/Table.jsx'
import SearchFilterBar from '../../components/ui/SearchFilterBar.jsx'
import PageHeader from '../../components/ui/PageHeader.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useToast } from '../../hooks/useToast.js'

const MOCK_ROWS = [
  {
    id: 1,
    name: 'Grace Namono',
    ministry: "Children's Ministry",
    status: 'Active',
    joined: '2024-02-11',
  },
  {
    id: 2,
    name: 'Peter Bakashaba Ruhamiza',
    ministry: 'ICT',
    status: 'Active',
    joined: '2023-08-04',
  },
  {
    id: 3,
    name: 'Susan Kemigisha',
    ministry: "Children's Ministry",
    status: 'On leave',
    joined: '2022-11-19',
  },
]

const TABLE_COLUMNS = [
  { key: 'name', header: 'Name' },
  { key: 'ministry', header: 'Ministry', hideBelow: 'md' },
  {
    key: 'status',
    header: 'Status',
    render: (row) => (
      <Badge tone={row.status === 'Active' ? 'success' : 'warning'}>{row.status}</Badge>
    ),
  },
  { key: 'joined', header: 'Joined', hideBelow: 'lg' },
]

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-ink-100 bg-white p-6">
      <h2 className="mb-4 font-display text-lg font-semibold text-ink-900">{title}</h2>
      {children}
    </section>
  )
}

export default function UiKitPage() {
  const { push } = useToast()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [modalError, setModalError] = useState(null)
  const [isConfirmOpen, setIsConfirmOpen] = useState(false)
  const [tableState, setTableState] = useState('data')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filteredRows = MOCK_ROWS.filter((row) => {
    const matchesSearch = row.name.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || row.status === statusFilter
    return matchesSearch && matchesStatus
  })

  function openAddModal() {
    setModalError(null)
    setIsAddModalOpen(true)
  }

  return (
    <div className="space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Phase 3 — Core UI Component Library
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">UI Kit</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-500">
          A live preview of every shared component the seven modules use.
        </p>
      </div>

      <Section title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary">Primary</Button>
          <Button variant="brass">Brass</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="primary" isLoading>
            Saving…
          </Button>
          <Button variant="primary" disabled>
            Disabled
          </Button>
        </div>
      </Section>

      <Section title="Badges">
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral">Neutral</Badge>
          <Badge tone="brass">Brass</Badge>
          <Badge tone="success">Active</Badge>
          <Badge tone="warning">On leave</Badge>
          <Badge tone="danger">Overdue</Badge>
        </div>
      </Section>

      <Section title="Error banner">
        <ErrorBanner message="Could not save this record. Check your connection and try again." />
      </Section>

      <Section title="Toasts">
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => push('Record saved successfully.', { tone: 'success' })}
          >
            Trigger success toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => push('Something went wrong saving this record.', { tone: 'error' })}
          >
            Trigger error toast
          </Button>
          <Button
            variant="secondary"
            onClick={() => push('Sync will retry when back online.', { tone: 'info' })}
          >
            Trigger info toast
          </Button>
        </div>
      </Section>

      <Section title="Modals">
        <div className="flex flex-wrap gap-3">
          <Button onClick={openAddModal}>Open Add/Edit modal</Button>
          <Button variant="danger" onClick={() => setIsConfirmOpen(true)}>
            Open delete confirmation
          </Button>
        </div>
      </Section>

      <Section title="Page header (standard module shape, §8.1)">
        <div className="rounded-lg border border-dashed border-ink-200 p-4">
          <PageHeader
            title="Personnel"
            count={filteredRows.length}
            countLabel="person"
            moduleKey="personnel"
            addLabel="Add Person"
            onAdd={() =>
              push('This is a preview — real Add flow arrives with the module.', { tone: 'info' })
            }
          />
        </div>
      </Section>

      <Section title="Search & filter bar (§8.2)">
        <SearchFilterBar
          searchValue={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name…"
          filters={[
            {
              key: 'status',
              value: statusFilter,
              onChange: setStatusFilter,
              options: [
                { value: 'all', label: 'All statuses' },
                { value: 'Active', label: 'Active' },
                { value: 'On leave', label: 'On leave' },
              ],
            },
          ]}
        />
      </Section>

      <Section title="Table (§8.3)">
        <div className="mb-4 flex flex-wrap gap-2">
          <Button size="sm" variant="secondary" onClick={() => setTableState('data')}>
            Show data
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setTableState('loading')}>
            Show loading
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setTableState('empty')}>
            Show empty
          </Button>
        </div>
        <Table
          columns={TABLE_COLUMNS}
          rows={tableState === 'empty' ? [] : filteredRows}
          isLoading={tableState === 'loading'}
          emptyTitle="No people found"
          emptyDescription="Try a different search term or filter."
        />
      </Section>

      <Section title="Empty state">
        <EmptyState
          title="No documents uploaded yet"
          description="Documents added to this ministry will appear here."
          action={<Button size="sm">Upload a document</Button>}
        />
      </Section>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Person"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => setModalError('A person with this name already exists in Personnel.')}
            >
              Save
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {modalError && <ErrorBanner message={modalError} onDismiss={() => setModalError(null)} />}
          <div>
            <label
              htmlFor="uikit-full-name"
              className="mb-1 block text-sm font-medium text-ink-700"
            >
              Full name
            </label>
            <input
              id="uikit-full-name"
              type="text"
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="e.g. Grace Namono"
            />
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={() => {
          setIsConfirmOpen(false)
          push('Record deleted.', { tone: 'success' })
        }}
        title="Delete person"
        message="This will permanently remove this person from Personnel. This cannot be undone."
      />
    </div>
  )
}
