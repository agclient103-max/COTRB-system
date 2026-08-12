import { Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { ROLE_LABELS, hasModuleAccess, canApprove } from '../data/roles.js'
import {
  MEMBERSHIP_STATS,
  GIVING_STATS,
  MINISTRY_COORDINATORS,
  WEEKLY_ACTIVITIES,
  PENDING_APPROVALS,
} from '../data/dashboardMockData.js'
import { formatNumber, formatUgxCompact } from '../utils/format.js'
import StatCard from '../components/ui/StatCard.jsx'
import Badge from '../components/ui/Badge.jsx'
import EmptyState from '../components/ui/EmptyState.jsx'

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

export default function Dashboard() {
  const { user } = useAuth()

  const showMembership = hasModuleAccess(user.role, 'personnel')
  const showAttendance = hasModuleAccess(user.role, 'reports')
  const showGiving = hasModuleAccess(user.role, 'financial')
  const showMinistrySnapshot = hasModuleAccess(user.role, 'ministry')
  const showApprovals = canApprove(user.role, 'documents')
  // Weekly activities are effectively public info — every role, including Guest, has at
  // least READ on Events per the matrix, so this always renders.
  const showActivities = hasModuleAccess(user.role, 'events')

  const hasAnyStatCard = showMembership || showAttendance || showGiving

  return (
    <div className="space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Phase 4 — Dashboard &amp; Analytics Home
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          Welcome, {user.name}
        </h1>
        <p className="mt-1 text-sm text-ink-500">
          {ROLE_LABELS[user.role]}
          {user.ministry && <> · {user.ministry}</>}
        </p>
      </div>

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

        {!showActivities && !showMinistrySnapshot && !showApprovals && !hasAnyStatCard && (
          <div className="lg:col-span-2">
            <EmptyState
              title="Nothing to show yet"
              description="Your role doesn't have access to any dashboard widgets yet."
            />
          </div>
        )}
      </div>
    </div>
  )
}
