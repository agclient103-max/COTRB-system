import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { ROLE_LABELS, hasModuleAccess, canApprove, canCreate } from '../data/roles.js'
import {
  MEMBERSHIP_STATS,
  GIVING_STATS,
  MINISTRY_COORDINATORS,
  WEEKLY_ACTIVITIES,
  PENDING_APPROVALS,
} from '../data/dashboardMockData.js'
import { formatNumber, formatUgxCompact } from '../utils/format.js'
import { api } from '../api/client.js'
import { Icon } from '../components/layout/Icon.jsx'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

function QuickStatCard({ icon, count, label, onAdd, addLabel }) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-ink-100 bg-white p-5">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-ink-50 text-ink-600">
        <Icon name={icon} className="h-5 w-5" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-display text-2xl font-semibold text-ink-900">{count}</p>
        <p className="truncate text-xs font-medium text-ink-500">{label}</p>
      </div>
      {onAdd && (
        <button
          type="button"
          onClick={onAdd}
          aria-label={addLabel}
          title={addLabel}
          className="flex h-8 w-8 flex-none items-center justify-center rounded-lg border border-ink-200 text-ink-500 transition hover:border-brass-400 hover:text-brass-600"
        >
          <Icon name="plus" className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}

function WidgetCard({ title, viewAllTo, viewAllLabel = 'View all', children }) {
  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-base font-semibold text-ink-900">{title}</h2>
        {viewAllTo && (
          <Link to={viewAllTo} className="text-xs font-medium text-brass-600 hover:text-brass-700">
            {viewAllLabel} →
          </Link>
        )}
      </div>
      {children}
    </div>
  )
}

function QuickActionButton({ icon, label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2 rounded-lg border border-ink-200 bg-white px-3.5 py-2 text-sm font-medium text-ink-700 transition hover:border-brass-300 hover:bg-brass-50/40 hover:text-brass-700"
    >
      <Icon name={icon} className="h-4 w-4 flex-none" />
      {label}
    </button>
  )
}

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [personnel, setPersonnel] = useState([])
  const [ministries, setMinistries] = useState([])
  const [events, setEvents] = useState([])
  const [documents, setDocuments] = useState([])
  const [isLoadingLive, setIsLoadingLive] = useState(true)

  // Live counts and "recently added" widgets read straight from each module's live API.
  useEffect(() => {
    let cancelled = false
    async function loadAll() {
      try {
        const [p, m, e, d] = await Promise.all([
          hasModuleAccess(user.role, 'personnel')
            ? api.get('/api/personnel').then((body) => body.personnel)
            : Promise.resolve([]),
          hasModuleAccess(user.role, 'ministry')
            ? api.get('/api/ministries').then((body) => body.ministries)
            : Promise.resolve([]),
          hasModuleAccess(user.role, 'events')
            ? api.get('/api/events').then((body) => body.events)
            : Promise.resolve([]),
          hasModuleAccess(user.role, 'documents')
            ? api.get('/api/documents').then((body) => body.documents)
            : Promise.resolve([]),
        ])
        if (!cancelled) {
          setPersonnel(p)
          setMinistries(m)
          setEvents(e)
          setDocuments(d)
          setIsLoadingLive(false)
        }
      } catch {
        if (!cancelled) setIsLoadingLive(false)
      }
    }
    loadAll()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const showMembership = hasModuleAccess(user.role, 'personnel')
  const showAttendance = hasModuleAccess(user.role, 'reports')
  const showGiving = hasModuleAccess(user.role, 'financial')
  const showMinistrySnapshot = hasModuleAccess(user.role, 'ministry')
  const showApprovals = canApprove(user.role, 'documents')
  const showActivities = hasModuleAccess(user.role, 'events')
  const hasAnyStatCard = showMembership || showAttendance || showGiving

  const recentPersonnel = useMemo(
    () =>
      [...personnel]
        .filter((p) => p.createdAt)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 4),
    [personnel],
  )

  const upcomingEvents = useMemo(
    () => events.filter((e) => e.status === 'Upcoming' || e.status === 'Recurring').slice(0, 4),
    [events],
  )

  function goToAdd(path) {
    navigate(`${path}?action=add`)
  }

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Icon name="dashboard" className="h-5 w-5 text-brass-600" />
            <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
              Dashboard
            </h1>
          </div>
          <p className="mt-1 text-sm text-ink-500">
            Welcome, {user.name} · {ROLE_LABELS[user.role]}
            {user.ministry && <> · {user.ministry}</>}
          </p>
        </div>
      </div>

      {/* Quick stat cards — live counts from each module's real store, with a gated "+" for
          roles that can create new records. */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {showMembership && (
          <QuickStatCard
            icon="personnel"
            count={isLoadingLive ? '—' : formatNumber(personnel.length)}
            label="Personnel Records"
            onAdd={canCreate(user.role, 'personnel') ? () => goToAdd('/personnel') : undefined}
            addLabel="Add Person"
          />
        )}
        {showMinistrySnapshot && (
          <QuickStatCard
            icon="ministry"
            count={isLoadingLive ? '—' : formatNumber(ministries.length)}
            label="Ministries & Fellowships"
            onAdd={canCreate(user.role, 'ministry') ? () => goToAdd('/ministry') : undefined}
            addLabel="Add Ministry"
          />
        )}
        {showActivities && (
          <QuickStatCard
            icon="events"
            count={isLoadingLive ? '—' : formatNumber(events.length)}
            label="Events on Calendar"
            onAdd={canCreate(user.role, 'events') ? () => goToAdd('/events') : undefined}
            addLabel="Add Event"
          />
        )}
        {hasModuleAccess(user.role, 'documents') && (
          <QuickStatCard
            icon="documents"
            count={isLoadingLive ? '—' : formatNumber(documents.length)}
            label="Documents on File"
            onAdd={canCreate(user.role, 'documents') ? () => goToAdd('/documents') : undefined}
            addLabel="Add Document"
          />
        )}
      </div>

      {/* Reported org-wide figures — distinct from the live record counts above. */}
      {hasAnyStatCard && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {showMembership && (
            <StatCard
              label="Total Members"
              value={formatNumber(MEMBERSHIP_STATS.totalMembers)}
              sublabel="Across the main parish and affiliated churches"
            />
          )}
          {showAttendance && (
            <StatCard
              label="Average Attendance"
              value={formatNumber(MEMBERSHIP_STATS.attendanceAvg)}
              sublabel={`Peak: ${formatNumber(MEMBERSHIP_STATS.attendancePeak)}`}
            />
          )}
          {showGiving && (
            <StatCard
              label="Giving (Monthly Avg)"
              value={formatUgxCompact(GIVING_STATS.monthlyAverage)}
              tone="brass"
              sublabel={`YTD: ${formatUgxCompact(GIVING_STATS.ytdTotal)} · ${GIVING_STATS.percentOfBudgetYtd}% of 2026 budget`}
            />
          )}
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {showMembership && (
          <WidgetCard title="Recently Added Personnel" viewAllTo="/personnel">
            {recentPersonnel.length === 0 ? (
              <EmptyState
                title="No personnel yet"
                description="People added to the directory will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {recentPersonnel.map((p) => (
                  <li key={p.localId} className="flex items-center justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
                      {p.name}
                    </span>
                    <Badge tone="neutral">{p.category}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        )}

        {showActivities && (
          <WidgetCard title="Upcoming Events" viewAllTo="/events" viewAllLabel="View calendar">
            {upcomingEvents.length === 0 ? (
              <EmptyState
                title="Nothing upcoming"
                description="Events marked Upcoming or Recurring will appear here."
              />
            ) : (
              <ul className="space-y-3">
                {upcomingEvents.map((e) => (
                  <li key={e.localId} className="flex items-start justify-between gap-3">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-ink-800">
                      {e.title}
                    </span>
                    <span className="flex-none text-right text-xs text-ink-400">{e.when}</span>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        )}

        {showActivities && (
          <WidgetCard
            title="This Week's Ministry Activities"
            viewAllTo="/events"
            viewAllLabel="View calendar"
          >
            <ul className="space-y-3">
              {WEEKLY_ACTIVITIES.map((activity) => (
                <li key={activity.name} className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-ink-800">{activity.name}</span>
                  <span className="text-right text-xs text-ink-400">{activity.schedule}</span>
                </li>
              ))}
            </ul>
          </WidgetCard>
        )}

        {showMinistrySnapshot && (
          <WidgetCard
            title="Ministry Coordinators"
            viewAllTo="/ministry"
            viewAllLabel="View all ministries"
          >
            <ul className="space-y-3">
              {MINISTRY_COORDINATORS.slice(0, 5).map((m) => (
                <li key={m.area} className="flex items-start justify-between gap-3">
                  <span className="text-sm font-medium text-ink-800">{m.area}</span>
                  <span className="text-right text-xs text-ink-400">{m.coordinator}</span>
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-ink-400">
              {MINISTRY_COORDINATORS.length} ministries total
            </p>
          </WidgetCard>
        )}

        {showApprovals && (
          <WidgetCard
            title="Pending Approvals"
            viewAllTo="/documents"
            viewAllLabel="Review in Documents"
          >
            {PENDING_APPROVALS.length === 0 ? (
              <EmptyState title="Nothing pending" description="You're all caught up." />
            ) : (
              <ul className="space-y-3">
                {PENDING_APPROVALS.map((item) => (
                  <li key={item.category} className="flex items-center justify-between gap-3">
                    <span className="text-sm text-ink-700">{item.category}</span>
                    <Badge tone="warning">{item.count}</Badge>
                  </li>
                ))}
              </ul>
            )}
          </WidgetCard>
        )}

        {!showActivities &&
          !showMinistrySnapshot &&
          !showApprovals &&
          !hasAnyStatCard &&
          !showMembership && (
            <div className="lg:col-span-2">
              <EmptyState
                title="Nothing to show yet"
                description="Your role doesn't have access to any dashboard widgets yet."
              />
            </div>
          )}
      </div>

      {/* Quick Actions — one interactive bar to jump straight into the most common tasks,
          each gated by the same create rights as its module. */}
      <div className="rounded-xl border border-ink-100 bg-white p-5">
        <h2 className="mb-3 font-display text-base font-semibold text-ink-900">Quick Actions</h2>
        <div className="flex flex-wrap gap-2.5">
          {canCreate(user.role, 'personnel') && (
            <QuickActionButton
              icon="personnel"
              label="Add Person"
              onClick={() => goToAdd('/personnel')}
            />
          )}
          {canCreate(user.role, 'documents') && (
            <QuickActionButton
              icon="documents"
              label="Add Document"
              onClick={() => goToAdd('/documents')}
            />
          )}
          {canCreate(user.role, 'events') && (
            <QuickActionButton icon="events" label="Add Event" onClick={() => goToAdd('/events')} />
          )}
          {canCreate(user.role, 'financial') && (
            <QuickActionButton
              icon="financial"
              label="Add Transaction"
              onClick={() => goToAdd('/financial')}
            />
          )}
          {canCreate(user.role, 'ministry') && (
            <QuickActionButton
              icon="ministry"
              label="Add Ministry"
              onClick={() => goToAdd('/ministry')}
            />
          )}
          {hasModuleAccess(user.role, 'reports') && (
            <QuickActionButton
              icon="reports"
              label="View Reports"
              onClick={() => navigate('/reports')}
            />
          )}
          {hasModuleAccess(user.role, 'settings') && (
            <QuickActionButton
              icon="settings"
              label="Settings"
              onClick={() => navigate('/settings')}
            />
          )}
        </div>
      </div>
    </div>
  )
}
