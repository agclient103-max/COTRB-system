// Grouped sidebar navigation. Single-module clusters (Documents, Events, Settings) render
// as standalone links; logically-related pairs (People, Finance) render as collapsible
// groups — the same pattern used by mainstream church-management tools, applied honestly
// to COTRB's actual 7 modules rather than inventing new ones.
export const NAV_GROUPS = [
  {
    type: 'group',
    key: 'people',
    label: 'People',
    icon: 'users-group',
    items: [
      { key: 'personnel', label: 'Personnel', path: '/personnel', icon: 'personnel' },
      { key: 'ministry', label: 'Ministry', path: '/ministry', icon: 'ministry' },
    ],
  },
  { type: 'item', key: 'events', label: 'Events & Calendar', path: '/events', icon: 'events' },
  { type: 'item', key: 'documents', label: 'Documents', path: '/documents', icon: 'documents' },
  {
    type: 'group',
    key: 'finance',
    label: 'Finance',
    icon: 'financial',
    items: [
      { key: 'financial', label: 'Financial', path: '/financial', icon: 'financial' },
      { key: 'reports', label: 'Reports & Analytics', path: '/reports', icon: 'reports' },
    ],
  },
  { type: 'item', key: 'settings', label: 'Settings', path: '/settings', icon: 'settings' },
]

// Flat lookup used by the header (page title) and other places that need a simple list.
export const NAV_ITEMS = NAV_GROUPS.flatMap((entry) =>
  entry.type === 'group' ? entry.items : [entry],
)
