// All figures here trace back to §3.5 (Scale figures) and §3.3 (Ministry Coordinators) of the
// blueprint. Where a number isn't given directly (e.g. year-to-date giving), it's derived from
// the real monthly/annual figures rather than invented — noted inline.

export const MEMBERSHIP_STATS = {
  totalMembers: 450,
  attendanceAvg: 285,
  attendancePeak: 360,
}

// August is the 8th month — YTD giving derived as 8 × the real monthly average (§3.5),
// not a separately invented figure.
const MONTHS_ELAPSED = 8
export const GIVING_STATS = {
  monthlyAverage: 10_400_000,
  ytdTotal: 10_400_000 * MONTHS_ELAPSED,
  annualBudget: 1_260_000_000,
  get percentOfBudgetYtd() {
    return Math.round((this.ytdTotal / this.annualBudget) * 1000) / 10
  },
}

// The 11 real ministry coordinators from §3.3.
export const MINISTRY_COORDINATORS = [
  { area: 'Compassion & Care', coordinator: 'Mrs. Dorcas Jurua' },
  { area: 'Health & Wellness', coordinator: 'Dr. Kenneth Mugume' },
  { area: 'Mission & Evangelism', coordinator: 'Ms. Grace Nabwire' },
  { area: 'Prayer & Intercession', coordinator: 'Mrs. Agnes Odur' },
  { area: 'Youth Ministry (DYF)', coordinator: 'Mr. Leon Tusiime' },
  { area: "Children's Ministry", coordinator: 'Mrs. Abigail Mugume' },
  { area: 'Infrastructure & ICT', coordinator: 'Mr. Peter Bakashaba Ruhamiza' },
  { area: 'Discipleship & Nurture', coordinator: 'Mr. Picho Okello Junior' },
  { area: 'Education & Projects', coordinator: 'Prof. Edith Natukunda Togboa' },
  { area: 'Building & Construction', coordinator: 'Eng. Sam Mugume' },
  { area: 'Worship & Arts', coordinator: 'Mrs. Anne Katahoire' },
]

// Real recurring weekly schedule from §3.4 — used instead of inventing specific future
// calendar dates for one-off events that aren't in the source data.
export const WEEKLY_ACTIVITIES = [
  { name: 'Home Cells', schedule: 'Weekly, 9 active cells' },
  { name: 'Navigators Bible Study', schedule: 'Tuesdays, 6:00pm — 15 members' },
  { name: 'Bible Study Fellowship (BSF)', schedule: 'Monday evenings — 70 ladies' },
  { name: 'Prayer & Intercession', schedule: 'Fridays — 19 trained intercessors' },
]

// Pending approvals are shown by category and count only — no invented specific submitter
// names or document titles, since the blueprint doesn't provide real examples and this is a
// mock landing page, not real records.
export const PENDING_APPROVALS = [
  { category: 'Documents awaiting sign-off', count: 3 },
  { category: 'Expense reports pending review', count: 1 },
]
