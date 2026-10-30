import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 bg-white px-8 py-4">
          <p className="text-center text-xs text-slate-500">
            SIGO-Dental · Sistema Integral de Gestión Odontológica
          </p>
        </footer>
      </div>
    </div>
  )
}