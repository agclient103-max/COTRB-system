import { useEffect, useState } from 'react'
import { useAuth } from '../../hooks/useAuth.js'
import {
  hasModuleAccess,
  canUpdate,
  canDelete,
  ROLES,
  ROLE_LABELS,
  MODULES,
  MODULE_LABELS,
  ACCESS_MATRIX,
} from '../../data/roles.js'
import { NOTIFICATION_CATEGORIES } from '../../data/notificationDefaults.js'
import { api } from '../../api/client.js'
import { useToast } from '../../hooks/useToast.js'
import Table from '../../components/ui/Table.jsx'
import Badge from '../../components/ui/Badge.jsx'
import Button from '../../components/ui/Button.jsx'
import ErrorBanner from '../../components/ui/ErrorBanner.jsx'
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import Modal from '../../components/ui/Modal.jsx'

const TABS = [
  { key: 'users', label: 'Users & Roles' },
  { key: 'permissions', label: 'Permissions' },
  { key: 'audit', label: 'Audit Log' },
  { key: 'backup', label: 'Backup & Recovery' },
  { key: 'notifications', label: 'Notifications' },
]

function permissionTone(code) {
  if (!code || code === 'NONE') return 'neutral'
  if (code.includes('APPROVE')) return 'brass'
  if (code.includes('SCOPED')) return 'warning'
  // By this point every read-only variant (READ, READ_APPROVE, READ_SCOPED) has already
  // been caught above, so a leading "C" here can only mean a real create-capable code
  // (CR, CRU, CRUD, ...) — safe to check without risking a match on the word "READ" itself.
  if (code.startsWith('C')) return 'success'
  return 'neutral'
}

function UsersTab({ canManage, canRemove }) {
  const { push } = useToast()
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    name: '',
    role: ROLES.MEMBER,
  })
  const [formError, setFormError] = useState(null)
  const [isSaving, setIsSaving] = useState(false)

  const [deletingUser, setDeletingUser] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setLoadError(null)
      try {
        const body = await api.get('/api/users')
        if (!cancelled) setUsers(body.users)
      } catch {
        if (!cancelled) setLoadError('Could not load user accounts. Please try refreshing.')
      }
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshToken])

  function openAddModal() {
    setFormError(null)
    setFormValues({ email: '', password: '', name: '', role: ROLES.MEMBER })
    setIsFormOpen(true)
  }

  async function handleCreate() {
    setIsSaving(true)
    setFormError(null)
    try {
      await api.post('/api/users', formValues)
      push('Account created.', { tone: 'success' })
      setIsFormOpen(false)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      setFormError(err.message)
    }
    setIsSaving(false)
  }

  async function handleRoleChange(user, role) {
    try {
      await api.put(`/api/users/${user.id}`, { role })
      push(`${user.email}'s role updated.`, { tone: 'success' })
      setRefreshToken((t) => t + 1)
    } catch (err) {
      push(err.message, { tone: 'error' })
    }
  }

  async function handleConfirmDelete() {
    if (!deletingUser) return
    setIsDeleting(true)
    setDeleteError(null)
    try {
      await api.delete(`/api/users/${deletingUser.id}`)
      push('Account removed.', { tone: 'success' })
      setDeletingUser(null)
      setRefreshToken((t) => t + 1)
    } catch (err) {
      setDeleteError(err.message)
    }
    setIsDeleting(false)
  }

  const columns = [
    { key: 'name', header: 'Name', render: (row) => row.name || row.email },
    { key: 'email', header: 'Email', hideBelow: 'sm' },
    {
      key: 'role',
      header: 'Role',
      render: (row) =>
        canManage ? (
          <select
            value={row.role ?? ''}
            onChange={(e) => handleRoleChange(row, e.target.value)}
            className="rounded-md border border-ink-200 bg-white px-2 py-1 text-xs"
          >
            <option value="" disabled>
              No role
            </option>
            {Object.values(ROLES).map((r) => (
              <option key={r} value={r}>
                {ROLE_LABELS[r]}
              </option>
            ))}
          </select>
        ) : (
          <Badge tone="brass">{row.role ? ROLE_LABELS[row.role] : 'No role'}</Badge>
        ),
    },
    {
      key: 'actions',
      header: '',
      hideBelow: 'md',
      render: (row) =>
        canRemove ? (
          <div className="flex justify-end">
            <Button size="sm" variant="ghost" onClick={() => setDeletingUser(row)}>
              Remove
            </Button>
          </div>
        ) : null,
    },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-ink-400">
          Real accounts, backed by Netlify Identity. Roles here drive access everywhere in the
          system.
        </p>
        {canManage && (
          <Button size="sm" onClick={openAddModal}>
            Add Account
          </Button>
        )}
      </div>
      {loadError && <ErrorBanner message={loadError} className="mb-4" />}
      <Table
        columns={columns}
        rows={users}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No accounts yet"
        emptyDescription="Accounts created here will appear in this list."
      />

      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title="Add Account"
        footer={
          <>
            <Button variant="secondary" onClick={() => setIsFormOpen(false)} disabled={isSaving}>
              Cancel
            </Button>
            <Button onClick={handleCreate} isLoading={isSaving}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}
          <div>
            <label htmlFor="user-name" className="mb-1 block text-sm font-medium text-ink-700">
              Full name
            </label>
            <input
              id="user-name"
              type="text"
              value={formValues.name}
              onChange={(e) => setFormValues((v) => ({ ...v, name: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
            />
          </div>
          <div>
            <label htmlFor="user-email" className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              id="user-email"
              type="email"
              value={formValues.email}
              onChange={(e) => setFormValues((v) => ({ ...v, email: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
            />
          </div>
          <div>
            <label htmlFor="user-password" className="mb-1 block text-sm font-medium text-ink-700">
              Temporary password
            </label>
            <input
              id="user-password"
              type="text"
              value={formValues.password}
              onChange={(e) => setFormValues((v) => ({ ...v, password: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="At least 8 characters"
            />
          </div>
          <div>
            <label htmlFor="user-role" className="mb-1 block text-sm font-medium text-ink-700">
              Role
            </label>
            <select
              id="user-role"
              value={formValues.role}
              onChange={(e) => setFormValues((v) => ({ ...v, role: e.target.value }))}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
            >
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingUser)}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleConfirmDelete}
        title="Remove account"
        message={`This will permanently remove "${deletingUser?.email ?? ''}". This cannot be undone.`}
        confirmLabel="Remove"
        isLoading={isDeleting}
        error={deleteError}
      />
    </div>
  )
}

function PermissionsTab() {
  const roleList = Object.values(ROLES)
  const columns = [
    { key: 'module', header: 'Module' },
    ...roleList.map((role) => ({
      key: role,
      header: ROLE_LABELS[role],
      hideBelow: role === ROLES.SUPER_ADMIN || role === ROLES.ADMIN ? undefined : 'lg',
      render: (row) => <Badge tone={permissionTone(row[role])}>{row[role] ?? 'NONE'}</Badge>,
    })),
  ]
  const rows = MODULES.map((m) => ({ localId: m, module: MODULE_LABELS[m], ...ACCESS_MATRIX[m] }))
  return (
    <div>
      <p className="mb-4 text-xs text-ink-400">
        The exact §6.2 access matrix — every role&rsquo;s permission level for every module,
        enforced server-side on every request.
      </p>
      <Table columns={columns} rows={rows} rowKey={(row) => row.localId} />
    </div>
  )
}

function AuditTab() {
  const [entries, setEntries] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [refreshToken, setRefreshToken] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function load() {
      setIsLoading(true)
      setError(null)
      try {
        const body = await api.get('/api/audit-log')
        if (!cancelled) setEntries(body.entries)
      } catch {
        if (!cancelled) setError('Could not load the audit log. Please try refreshing.')
      }
      if (!cancelled) setIsLoading(false)
    }
    load()
    return () => {
      cancelled = true
    }
  }, [refreshToken])

  const columns = [
    { key: 'timestamp', header: 'When', render: (row) => new Date(row.timestamp).toLocaleString() },
    {
      key: 'user',
      header: 'Who',
      render: (row) => (
        <span>
          {row.user_name}{' '}
          <span className="text-ink-400">({ROLE_LABELS[row.user_role] ?? row.user_role})</span>
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Action',
      hideBelow: 'sm',
      render: (row) => (
        <Badge tone={row.action === 'deleted' ? 'danger' : 'success'}>{row.action}</Badge>
      ),
    },
    { key: 'module_label', header: 'Module', hideBelow: 'md' },
    { key: 'record_label', header: 'Record', hideBelow: 'lg' },
  ]

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs text-ink-400">
          Every create, update, merge, and delete across every module, logged server-side.
        </p>
        <Button size="sm" variant="secondary" onClick={() => setRefreshToken((t) => t + 1)}>
          Refresh
        </Button>
      </div>
      {error && <ErrorBanner message={error} className="mb-4" />}
      <Table
        columns={columns}
        rows={entries}
        rowKey={(row) => row.id}
        isLoading={isLoading}
        emptyTitle="No activity yet"
        emptyDescription="Actions taken across the system will appear here."
      />
    </div>
  )
}

function BackupTab() {
  const { push } = useToast()
  const [exportError, setExportError] = useState(null)
  const [isExporting, setIsExporting] = useState(false)

  async function handleExport() {
    setExportError(null)
    setIsExporting(true)
    try {
      const payload = await api.get('/api/backup/export')
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cotrb-backup-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      push('Backup downloaded.', { tone: 'success' })
    } catch (err) {
      setExportError(err.message)
    }
    setIsExporting(false)
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-ink-900">Export backup</h2>
        <p className="mt-1 text-sm text-ink-500">
          Downloads every module&rsquo;s records, straight from the live database, as one JSON file.
        </p>
        {exportError && <ErrorBanner message={exportError} className="mt-3" />}
        <Button className="mt-4" onClick={handleExport} isLoading={isExporting}>
          Export all data
        </Button>
      </div>

      <div className="rounded-xl border border-dashed border-ink-200 bg-white p-5">
        <h2 className="font-display text-base font-semibold text-ink-900">Restore from backup</h2>
        <p className="mt-1 text-sm text-ink-500">
          Restoring into the live, shared database is a higher-risk operation than the old
          local-only version — it isn&rsquo;t available from this screen yet. Contact your system
          administrator if you need to restore from a backup file.
        </p>
      </div>
    </div>
  )
}

function NotificationsTab({ canWrite }) {
  const [prefs, setPrefs] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const body = await api.get('/api/notification-preferences')
        if (!cancelled) setPrefs(body.prefs)
      } catch {
        if (!cancelled) setError('Could not load your notification preferences.')
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  async function toggle(key) {
    if (!prefs) return
    setError(null)
    const next = { ...prefs, [key]: !prefs[key] }
    setPrefs(next) // optimistic — feels instant, corrected below if the save fails
    try {
      const body = await api.put('/api/notification-preferences', { prefs: next })
      setPrefs(body.prefs)
    } catch (err) {
      setPrefs(prefs) // roll back
      setError(err.message)
    }
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5">
      <p className="mb-4 text-xs text-ink-400">
        These preferences are saved server-side against your account and will control real email/SMS
        delivery once the notification backend is connected.
      </p>
      {error && <ErrorBanner message={error} className="mb-4" />}
      {!prefs ? (
        <p className="text-sm text-ink-400">Loading…</p>
      ) : (
        <div className="space-y-4">
          {NOTIFICATION_CATEGORIES.map((cat) => (
            <div key={cat.key} className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-ink-800">{cat.label}</p>
                <p className="text-xs text-ink-400">{cat.description}</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={prefs[cat.key]}
                aria-label={cat.label}
                disabled={!canWrite}
                onClick={() => toggle(cat.key)}
                className={[
                  'relative h-6 w-11 flex-none rounded-full transition disabled:cursor-not-allowed disabled:opacity-50',
                  prefs[cat.key] ? 'bg-brass-500' : 'bg-ink-200',
                ].join(' ')}
              >
                <span
                  className={[
                    'absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition',
                    prefs[cat.key] ? 'left-5' : 'left-0.5',
                  ].join(' ')}
                />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('users')
  const canView = hasModuleAccess(user.role, 'settings')
  const canWrite = canUpdate(user.role, 'settings')
  const canRemoveAccounts = canDelete(user.role, 'settings')

  if (!canView) {
    return (
      <div className="px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md">
          <EmptyState
            title="Access restricted"
            description="Your role doesn't have access to Settings. Contact an administrator if you believe this is a mistake."
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          System Settings &amp; Administration
        </h1>
        {!canWrite && (
          <p className="mt-1 text-sm text-ink-500">Your role has read-only access to Settings.</p>
        )}
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-ink-100">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={[
              'flex-none border-b-2 px-4 py-2.5 text-sm font-medium transition',
              activeTab === tab.key
                ? 'border-brass-500 text-ink-900'
                : 'border-transparent text-ink-400 hover:text-ink-700',
            ].join(' ')}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'users' && <UsersTab canManage={canWrite} canRemove={canRemoveAccounts} />}
      {activeTab === 'permissions' && <PermissionsTab />}
      {activeTab === 'audit' && <AuditTab />}
      {activeTab === 'backup' && <BackupTab />}
      {activeTab === 'notifications' && <NotificationsTab canWrite={canWrite} />}
    </div>
  )
}
