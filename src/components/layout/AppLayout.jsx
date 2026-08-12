import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header.jsx'
import Sidebar from './Sidebar.jsx'

export default function AppLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-canvas">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header onOpenSidebar={() => setIsSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
