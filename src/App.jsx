import { useEffect } from 'react'
import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ToastViewport from './components/ui/ToastViewport.jsx'
import AppRouter from './router/AppRouter.jsx'
import { startAutoSync } from './utils/syncEngine.js'

export default function App() {
  useEffect(() => {
    startAutoSync()
  }, [])

  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
        <ToastViewport />
      </ToastProvider>
    </AuthProvider>
  )
}
