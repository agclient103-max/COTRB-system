import { useEffect, useRef, useState } from 'react'
import { Icon } from './Icon.jsx'

export default function HelpPopover() {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Help"
        className="rounded-md p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
      >
        <Icon name="help" className="h-5 w-5" />
      </button>
      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-ink-100 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold text-ink-900">Need a hand?</p>
          <p className="mt-1 text-xs text-ink-500">
            For help using COTRB, contact your system administrator. Support tools like guided tours
            and a full help center will be added once the system is in live use.
          </p>
        </div>
      )}
    </div>
  )
}
