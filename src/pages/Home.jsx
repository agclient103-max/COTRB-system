function ChecklistItem({ label }) {
  return (
    <li className="flex items-center gap-3 text-ink-700">
      <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-brass-500 text-[11px] font-bold text-white">
        ✓
      </span>
      <span>{label}</span>
    </li>
  )
}

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-ink-100 bg-white p-10 shadow-[0_1px_2px_rgba(20,29,43,0.04),0_12px_32px_-16px_rgba(20,29,43,0.18)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Phase 0 — Foundation
        </p>
        <h1 className="font-display text-3xl font-semibold leading-tight text-ink-900 sm:text-4xl">
          COTRB Church Management System
        </h1>
        <p className="mt-3 text-sm text-ink-500">
          Church of the Resurrection Bugolobi — main parish, Emmanuel Church Kasokoso, and Christ
          Community Church Mutungo.
        </p>

        <ul className="mt-8 space-y-3">
          <ChecklistItem label="Vite 8 + React 19 project scaffolded" />
          <ChecklistItem label="TailwindCSS 3.4+ configured with the COTRB palette" />
          <ChecklistItem label="React Router v6 wired up and rendering this route" />
          <ChecklistItem label="ESLint + Prettier configured" />
          <ChecklistItem label="Project folder structure in place for Phases 1–8" />
          <ChecklistItem label="Netlify deployment configuration in place" />
        </ul>

        <div className="mt-9 rounded-lg bg-ink-50 px-4 py-3 text-xs text-ink-500">
          This is a deliberately minimal placeholder. Login, navigation, and the seven core modules
          arrive in the phases that follow.
        </div>
      </div>
    </div>
  )
}
