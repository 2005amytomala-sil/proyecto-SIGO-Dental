import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Navbar from './Navbar'

export default function MainLayout() {
  const navigate = useNavigate()

  function cerrarSesion() {
    localStorage.removeItem('sigo_token')
    localStorage.removeItem('sigo_usuario')
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar />

        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>

        <footer className="flex items-center justify-between border-t border-slate-200 bg-white px-8 py-4">
          <p className="text-xs text-slate-500">
            SIGO-Dental · Sistema Integral de Gestión Odontológica
          </p>

          <button
            onClick={cerrarSesion}
            className="text-sm font-medium text-red-600 hover:text-red-800"
          >
            Cerrar sesión
          </button>
        </footer>
      </div>
    </div>
  )
}