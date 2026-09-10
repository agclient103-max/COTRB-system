export const NOTIFICATION_CATEGORIES = [
  {
    key: 'documentApproval',
    label: 'Document approval needed',
    description: 'When a document is submitted for your approval.',
  },
  {
    key: 'eventRsvp',
    label: 'Event RSVP updates',
    description: 'When someone RSVPs to an event you organize.',
  },
  {
    key: 'budgetWarning',
    label: 'Budget threshold warnings',
    description: 'When spending nears a category\u2019s budget limit.',
  },
  {
    key: 'newPersonnel',
    label: 'New personnel added',
    description: 'When a new person is added to the directory.',
  },
  {
    key: 'weeklyDigest',
    label: 'Weekly activity digest',
    description: 'A weekly summary of activity across all modules.',
  },
]

export const DEFAULT_NOTIFICATION_PREFS = NOTIFICATION_CATEGORIES.reduce((acc, cat) => {
  acc[cat.key] = true
  return acc
}, {})
