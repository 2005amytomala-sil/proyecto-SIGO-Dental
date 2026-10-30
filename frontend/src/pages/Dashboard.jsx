const statistics = [
  {
    title: 'Pacientes registrados',
    value: '128',
    description: 'Total de pacientes',
    icon: '♙',
    color: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'Citas de hoy',
    value: '18',
    description: 'Citas programadas',
    icon: '▣',
    color: 'bg-teal-100 text-teal-700',
  },
  {
    title: 'En atención',
    value: '04',
    description: 'Pacientes en consulta',
    icon: '✚',
    color: 'bg-violet-100 text-violet-700',
  },
  {
    title: 'Pendientes',
    value: '06',
    description: 'Citas por confirmar',
    icon: '◷',
    color: 'bg-amber-100 text-amber-700',
  },
]

const appointments = [
  {
    patient: 'María González',
    time: '09:00',
    treatment: 'Limpieza dental',
    professional: 'Dra. Andrea López',
    status: 'Confirmada',
  },
  {
    patient: 'Carlos Rodríguez',
    time: '10:00',
    treatment: 'Consulta general',
    professional: 'Dr. Miguel Torres',
    status: 'En espera',
  },
  {
    patient: 'Sofía Martínez',
    time: '11:30',
    treatment: 'Ortodoncia',
    professional: 'Dra. Andrea López',
    status: 'Confirmada',
  },
  {
    patient: 'Juan Pérez',
    time: '12:00',
    treatment: 'Revisión dental',
    professional: 'Dr. Miguel Torres',
    status: 'Pendiente',
  },
]

export default function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Encabezado */}
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Dashboard
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Resumen general de la actividad de la clínica.
          </p>
        </div>

        <button
          type="button"
          className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          + Nueva cita
        </button>
      </section>

      {/* Indicadores */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {statistics.map((statistic) => (
          <article
            key={statistic.title}
            className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  {statistic.title}
                </p>

                <p className="mt-3 text-3xl font-bold text-slate-800">
                  {statistic.value}
                </p>
              </div>

              <div
                className={`flex h-12 w-12 items-center justify-center rounded-xl text-xl ${statistic.color}`}
              >
                {statistic.icon}
              </div>
            </div>

            <p className="mt-4 text-xs text-slate-500">
              {statistic.description}
            </p>
          </article>
        ))}
      </section>

      {/* Contenido principal */}
      <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
        {/* Tabla de citas */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white xl:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="text-lg font-bold text-slate-800">
                Próximas citas
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Resumen de la agenda
              </p>
            </div>

            <button
              type="button"
              className="text-sm font-semibold text-teal-700 hover:text-teal-800"
            >
              Ver agenda →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Hora</th>
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Tratamiento</th>
                  <th className="px-6 py-4 font-semibold">Estado</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {appointments.map((appointment) => (
                  <tr
                    key={`${appointment.patient}-${appointment.time}`}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="whitespace-nowrap px-6 py-4 font-semibold text-slate-700">
                      {appointment.time}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <p className="font-medium text-slate-800">
                        {appointment.patient}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {appointment.professional}
                      </p>
                    </td>

                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">
                      {appointment.treatment}
                    </td>

                    <td className="whitespace-nowrap px-6 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          appointment.status === 'Confirmada'
                            ? 'bg-emerald-100 text-emerald-700'
                            : appointment.status === 'En espera'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {appointment.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Panel de accesos rápidos */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-800">
            Accesos rápidos
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Operaciones frecuentes
          </p>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-teal-300 hover:bg-teal-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-100 text-lg text-teal-700">
                ♙
              </span>

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Registrar paciente
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Crear una ficha nueva
                </span>
              </span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-blue-300 hover:bg-blue-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-lg text-blue-700">
                ▣
              </span>

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Agendar cita
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Programar una consulta
                </span>
              </span>
            </button>

            <button
              type="button"
              className="flex w-full items-center gap-4 rounded-xl border border-slate-200 p-4 text-left transition hover:border-violet-300 hover:bg-violet-50"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-lg text-violet-700">
                ▤
              </span>

              <span>
                <span className="block text-sm font-semibold text-slate-800">
                  Expedientes clínicos
                </span>

                <span className="mt-1 block text-xs text-slate-500">
                  Consultar expedientes
                </span>
              </span>
            </button>
          </div>
        </div>
      </section>

      <p className="text-xs text-slate-400">
        Los datos mostrados son ficticios y se utilizan únicamente para
        construir la interfaz inicial.
      </p>
    </div>
  )
}