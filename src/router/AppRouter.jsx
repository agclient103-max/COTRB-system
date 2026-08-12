import { Routes, Route } from 'react-router-dom'
import Home from '../pages/Home.jsx'
import NotFound from '../pages/NotFound.jsx'

// Phase 0: a minimal, provable route tree.
// Phase 1 adds /login and a ProtectedRoute wrapper.
// Phase 2 nests every module route inside the app Layout (Header + Sidebar).
export default function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
