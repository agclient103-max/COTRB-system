import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound from '../pages/NotFound.jsx'
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx'
import AppLayout from '../components/layout/AppLayout.jsx'
import DocumentsPage from '../pages/modules/DocumentsPage.jsx'
import MinistryPage from '../pages/modules/MinistryPage.jsx'
import PersonnelPage from '../pages/modules/PersonnelPage.jsx'
import FinancialPage from '../pages/modules/FinancialPage.jsx'
import EventsPage from '../pages/modules/EventsPage.jsx'
import ReportsPage from '../pages/modules/ReportsPage.jsx'
import SettingsPage from '../pages/modules/SettingsPage.jsx'

// Phase 2: every protected route now renders inside AppLayout (Header + Sidebar).
// Module routes are reachable by direct URL for any signed-in user at this stage —
// the sidebar already hides items a role can't access per the §6.2 matrix, and since
// these are placeholder pages with no real data or write actions yet, there is nothing
// to gate at the route level. Real per-module enforcement arrives with the modules
// themselves in Phase 5+, and — per the blueprint — must ultimately be re-checked
// server-side too, not just hidden here.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/documents" element={<DocumentsPage />} />
          <Route path="/ministry" element={<MinistryPage />} />
          <Route path="/personnel" element={<PersonnelPage />} />
          <Route path="/financial" element={<FinancialPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
