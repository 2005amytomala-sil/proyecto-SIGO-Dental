import { NavLink } from 'react-router-dom'

const menuItems = [
  { name: 'Dashboard', path: '/', icon: '▦' },
  { name: 'Pacientes', path: '/pacientes', icon: '♙' },
  { name: 'Agenda de citas', path: '/agenda', icon: '▣' },
  { name: 'Expedientes clínicos', path: '/expedientes', icon: '▤' },
  { name: 'Odontograma', path: '/odontograma', icon: '◉' },
  { name: 'Tratamientos', path: '/tratamientos', icon: '✚' },
  { name: 'Facturación', path: '/facturacion', icon: '$' },
  { name: 'Inventario', path: '/inventario', icon: '▧' },
  { name: 'Honorarios', path: '/comisiones', icon: '%' },
]

export default function Sidebar() {
  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-slate-900 text-white">
      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-700 px-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500 text-2xl font-bold">
          +
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-wide text-white">
            SIGO-Dental
          </h1>

          <p className="text-xs text-slate-400">
            Gestión odontológica
          </p>
        </div>
      </div>

      {/* Navegación */}
      <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
        <p className="mb-4 px-3 text-xs font-semibold uppercase tracking-widest text-slate-400">
          Menú principal
        </p>

        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-4 py-3 text-sm transition-colors ${
                isActive
                  ? 'bg-teal-500 font-semibold text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <span className="flex w-5 justify-center text-lg">
              {item.icon}
            </span>

            <span>{item.name}</span>
          </NavLink>
        ))}
      </nav>

      {/* Información inferior */}
      <div className="border-t border-slate-700 p-4">
        <div className="rounded-xl bg-slate-800 p-4">
          <p className="text-sm font-medium">
            Sistema clínico
          </p>

          <p className="mt-1 text-xs text-slate-400">
            Plataforma de administración
          </p>
        </div>
      </div>
    </aside>
  )
}
