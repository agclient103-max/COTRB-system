export const MEMBERSHIP_STATS = {
  totalMembers: 450,
  attendanceAvg: 285,
  attendancePeak: 360,
}

const MONTHS_ELAPSED = 8
export const GIVING_STATS = {
  monthlyAverage: 10_400_000,
  ytdTotal: 10_400_000 * MONTHS_ELAPSED,
  annualBudget: 1_260_000_000,
  get percentOfBudgetYtd() {
    return Math.round((this.ytdTotal / this.annualBudget) * 1000) / 10
  },
}

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

export const WEEKLY_ACTIVITIES = [
  { name: 'Home Cells', schedule: 'Weekly, 9 active cells' },
  { name: 'Navigators Bible Study', schedule: 'Tuesdays, 6:00pm — 15 members' },
  { name: 'Bible Study Fellowship (BSF)', schedule: 'Monday evenings — 70 ladies' },
  { name: 'Prayer & Intercession', schedule: 'Fridays — 19 trained intercessors' },
]

export const PENDING_APPROVALS = [
  { category: 'Documents awaiting sign-off', count: 3 },
  { category: 'Expense reports pending review', count: 1 },
]
