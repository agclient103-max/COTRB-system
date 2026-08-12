import { Routes, Route } from 'react-router-dom'
import Login from '../pages/Login.jsx'
import Dashboard from '../pages/Dashboard.jsx'
import NotFound from '../pages/NotFound.jsx'
import ProtectedRoute from '../components/auth/ProtectedRoute.jsx'

// Phase 1: mock auth with a single protected placeholder route.
// Phase 2 nests every module route inside the app Layout (Header + Sidebar),
// still wrapped by the same ProtectedRoute.
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Dashboard />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
