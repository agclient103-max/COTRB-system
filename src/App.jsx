import { AuthProvider } from './context/AuthContext.jsx'
import { ToastProvider } from './context/ToastContext.jsx'
import ToastViewport from './components/ui/ToastViewport.jsx'
import AppRouter from './router/AppRouter.jsx'

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <AppRouter />
        <ToastViewport />
      </ToastProvider>
    </AuthProvider>
  )
}
