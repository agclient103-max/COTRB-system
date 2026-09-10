// A small, deliberately simple icon set, drawn as plain geometric SVG primitives rather
// than pulled from an icon library — keeps the bundle light and avoids a dependency.

const common = {
  width: 20,
  height: 20,
  viewBox: '0 0 20 20',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.5,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

export function Icon({ name, className }) {
  switch (name) {
    case 'dashboard':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="3" width="6" height="6" rx="1" />
          <rect x="11" y="3" width="6" height="6" rx="1" />
          <rect x="3" y="11" width="6" height="6" rx="1" />
          <rect x="11" y="11" width="6" height="6" rx="1" />
        </svg>
      )
    case 'documents':
      return (
        <svg {...common} className={className}>
          <path d="M5 2.5h7l3 3v12a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-14a1 1 0 0 1 1-1Z" />
          <path d="M12 2.5v3h3" />
          <path d="M6.5 10.5h7M6.5 13.5h7M6.5 16h4" />
        </svg>
      )
    case 'ministry':
      return (
        <svg {...common} className={className}>
          <circle cx="7" cy="6.5" r="2.5" />
          <circle cx="14" cy="7.5" r="2" />
          <path d="M2.5 17c0-2.8 2-4.5 4.5-4.5s4.5 1.7 4.5 4.5" />
          <path d="M12 12.8c2 0 3.5 1.6 3.5 4.2" />
        </svg>
      )
    case 'personnel':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="4" width="14" height="12.5" rx="1.5" />
          <circle cx="8" cy="9" r="1.8" />
          <path d="M5.3 14c.4-1.7 1.5-2.5 2.7-2.5s2.3.8 2.7 2.5" />
          <path d="M12.5 8h2.5M12.5 11h2.5" />
        </svg>
      )
    case 'financial':
      return (
        <svg {...common} className={className}>
          <circle cx="10" cy="10" r="7" />
          <path d="M10 6v8M12.2 7.7c-.4-.5-1.2-.9-2.2-.9-1.4 0-2.4.7-2.4 1.8 0 2.4 4.6 1.2 4.6 3.6 0 1.1-1 1.8-2.4 1.8-1.1 0-1.9-.4-2.4-1" />
        </svg>
      )
    case 'events':
      return (
        <svg {...common} className={className}>
          <rect x="3" y="4" width="14" height="13" rx="1.5" />
          <path d="M3 8h14" />
          <path d="M6.5 2.5v3M13.5 2.5v3" />
          <path d="M7 11.5h1.5M11.5 11.5H13M7 14h1.5" />
        </svg>
      )
    case 'reports':
      return (
        <svg {...common} className={className}>
          <path d="M4 16.5V9M9 16.5V4.5M14 16.5v-6" />
          <path d="M2.5 17h15" />
        </svg>
      )
    case 'settings':
      return (
        <svg {...common} className={className}>
          <circle cx="10" cy="10" r="2.6" />
          <path d="M10 3.2v1.7M10 15.1v1.7M16.8 10h-1.7M4.9 10H3.2M14.9 5.1l-1.2 1.2M6.3 13.7l-1.2 1.2M14.9 14.9l-1.2-1.2M6.3 6.3 5.1 5.1" />
        </svg>
      )
    case 'menu':
      return (
        <svg {...common} className={className}>
          <path d="M3 6h14M3 10h14M3 14h14" />
        </svg>
      )
    case 'close':
      return (
        <svg {...common} className={className}>
          <path d="M5 5l10 10M15 5 5 15" />
        </svg>
      )
    case 'search':
      return (
        <svg {...common} className={className}>
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M16.5 16.5 13 13" />
        </svg>
      )
    case 'bell':
      return (
        <svg {...common} className={className}>
          <path d="M5.5 8.5a4.5 4.5 0 0 1 9 0c0 3.2 1 4.5 1.5 5H4c.5-.5 1.5-1.8 1.5-5Z" />
          <path d="M8.3 16a1.8 1.8 0 0 0 3.4 0" />
        </svg>
      )
    case 'help':
      return (
        <svg {...common} className={className}>
          <circle cx="10" cy="10" r="7.5" />
          <path d="M7.8 7.8a2.2 2.2 0 1 1 3 2c-.6.4-1 .8-1 1.7v.3" strokeLinecap="round" />
          <path d="M9.8 14.2h.01" strokeLinecap="round" strokeWidth="2" />
        </svg>
      )
    case 'chevron-down':
      return (
        <svg {...common} className={className}>
          <path d="M5.5 7.5 10 12l4.5-4.5" />
        </svg>
      )
    case 'chevron-right':
      return (
        <svg {...common} className={className}>
          <path d="M7.5 5.5 12 10l-4.5 4.5" />
        </svg>
      )
    case 'plus':
      return (
        <svg {...common} className={className}>
          <path d="M10 4.5v11M4.5 10h11" />
        </svg>
      )
    case 'logout':
      return (
        <svg {...common} className={className}>
          <path d="M8 17H4.5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1H8" />
          <path d="M13 14l4-4-4-4M17 10H7.5" />
        </svg>
      )
    case 'church':
      return (
        <svg {...common} className={className}>
          <path d="M10 2.5v3M8.3 4.2h3.4" />
          <path d="M10 5.5 3.5 9.5V17h13V9.5L10 5.5Z" />
          <path d="M8 17v-4a2 2 0 0 1 4 0v4" />
        </svg>
      )
    case 'users-group':
      return (
        <svg {...common} className={className}>
          <circle cx="7" cy="7" r="2.3" />
          <circle cx="14" cy="8" r="1.8" />
          <path d="M2.8 16.5c0-2.5 1.8-4 4.2-4s4.2 1.5 4.2 4" />
          <path d="M12.2 12.9c1.8.1 3 1.4 3 3.6" />
        </svg>
      )
    default:
      return null
  }
}
