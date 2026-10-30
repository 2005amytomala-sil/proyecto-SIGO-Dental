export default function Navbar() {
  const today = new Date().toLocaleDateString('es-EC', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <header className="flex h-20 items-center justify-between gap-4 border-b border-slate-200 bg-white px-8">
      <div className="relative w-full max-w-md">
        <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-slate-400">
          ⌕
        </span>

        <input
          type="search"
          placeholder="Buscar pacientes, citas o expedientes..."
          className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
        />
      </div>

      <div className="flex items-center gap-6">
        <p className="hidden text-sm capitalize text-slate-500 lg:block">
          {today}
        </p>

        <button
          type="button"
          aria-label="Notificaciones"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 transition hover:bg-slate-50"
        >
          🔔
          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
            AL
          </div>

          <div className="hidden sm:block">
            <p className="text-sm font-semibold text-slate-800">
              Dra. Andrea López
            </p>
            <p className="text-xs text-slate-500">Odontóloga</p>
          </div>
        </div>
      </div>
    </header>
  )
}
