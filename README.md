# COTRB Church Management System

Offline-first, role-based church management system for Church of the Resurrection Bugolobi
(main parish), Emmanuel Church Kasokoso, and Christ Community Church Mutungo.

## Tech stack

- **React 19** + **Vite 8**
- **TailwindCSS 3.4+**
- **React Router v6**
- State management: Context API + custom hooks (no Redux/Zustand)
- Local persistence (from Phase 1 onward): IndexedDB primary, localStorage fallback
- Deployment: Netlify

## Project status

**Phase 0 — Foundation: complete.**

This is the project scaffold only. Login, navigation, and the seven core modules
(Documents, Ministry, Personnel, Financial, Events & Calendar, Reports & Analytics,
Settings & Administration) are not built yet — they arrive in the phases that follow,
each phase shipped and verified independently.

## Getting started

```bash
npm install
npm run dev
```

Then open the local URL Vite prints (typically `http://localhost:5173`).

## Available scripts

| Command                | What it does                                                         |
| ---------------------- | -------------------------------------------------------------------- |
| `npm run dev`          | Start the local dev server with hot reload                           |
| `npm run build`        | Production build, output to `dist/`                                  |
| `npm run preview`      | Serve the production build locally, to sanity-check before deploying |
| `npm run lint`         | Run ESLint across the project                                        |
| `npm run format`       | Auto-format the project with Prettier                                |
| `npm run format:check` | Check formatting without changing files                              |

## Deploying

```bash
npm run build && netlify deploy --prod
```

`netlify.toml` is already configured with the correct build command, publish directory
(`dist`), and the SPA redirect rule required for React Router (without it, refreshing any
non-root route on the live site returns a 404).

## Folder structure

```
src/
  assets/            static assets (images, icons)
  components/
    layout/           Header, Sidebar, app shell (Phase 2)
    ui/                shared UI primitives — Button, Table, Modal, etc. (Phase 3)
  context/            React Context providers (auth, app state)
  data/               seed/mock organizational data
  db/                 IndexedDB schema and access helpers
  hooks/              custom hooks (useDocuments, useFinances, etc.)
  pages/              route-level page components
  router/             route definitions
  utils/              shared utility functions
```

## Design system

The palette is defined in `tailwind.config.js` under `theme.extend.colors`:

- `ink` — deep vestry blue, used for text and primary UI chrome
- `brass` — warm gold accent, used for highlights and primary actions
- `canvas` — the app's base background color

Typefaces: **Fraunces** (display) and **Inter** (body/UI), loaded via Google Fonts in
`src/index.css`.
