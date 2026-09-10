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
import UiKitPage from '../pages/dev/UiKitPage.jsx'

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
          <Route path="/ui-kit" element={<UiKitPage />} />
        </Route>
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
