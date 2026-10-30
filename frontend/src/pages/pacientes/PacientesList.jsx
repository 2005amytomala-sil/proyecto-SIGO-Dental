import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { listarPacientes } from '../../services/pacientesService'
import { AlertasBadge } from '../../components/pacientes/AlertasMedicas'

const LIMITE = 10

export default function PacientesList() {
  const [buscar, setBuscar] = useState('')
  const [pagina, setPagina] = useState(1)
  const [resultado, setResultado] = useState({ datos: [], total: 0 })
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelado = false
    const temporizador = setTimeout(() => {
      setCargando(true)
      listarPacientes({ buscar, pagina, limite: LIMITE })
        .then((datos) => {
          if (!cancelado) {
            setResultado(datos)
            setError('')
          }
        })
        .catch((err) => !cancelado && setError(err.message))
        .finally(() => !cancelado && setCargando(false))
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [buscar, pagina])

  const totalPaginas = Math.max(Math.ceil(resultado.total / LIMITE), 1)

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Pacientes</h1>
          <p className="mt-2 text-sm text-slate-500">Registro y consulta de fichas de pacientes.</p>
        </div>
        <Link
          to="/pacientes/nuevo"
          className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          + Nuevo paciente
        </Link>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-200 p-4">
          <input
            type="search"
            value={buscar}
            onChange={(e) => {
              setBuscar(e.target.value)
              setPagina(1)
            }}
            placeholder="Buscar por cédula, nombres o apellidos..."
            className="w-full max-w-md rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:border-teal-400 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>

        {error ? (
          <p className="p-6 text-sm text-red-600">{error}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-6 py-4 font-semibold">Cédula</th>
                  <th className="px-6 py-4 font-semibold">Paciente</th>
                  <th className="px-6 py-4 font-semibold">Edad</th>
                  <th className="px-6 py-4 font-semibold">Teléfono</th>
                  <th className="px-6 py-4 font-semibold">Seguro</th>
                  <th className="px-6 py-4 font-semibold">Alertas</th>
                  <th className="px-6 py-4" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado.datos.map((paciente) => (
                  <tr key={paciente.id} className="transition hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{paciente.cedula}</td>
                    <td className="whitespace-nowrap px-6 py-4 font-medium text-slate-800">
                      {paciente.apellidos}, {paciente.nombres}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{paciente.edad} años</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{paciente.telefono}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-slate-600">{paciente.seguro_nombre ?? '—'}</td>
                    <td className="px-6 py-4">
                      <AlertasBadge alertas={paciente.alertas} />
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      <Link to={`/pacientes/${paciente.id}`} className="font-semibold text-teal-700 hover:text-teal-800">
                        Ver ficha →
                      </Link>
                    </td>
                  </tr>
                ))}
                {!cargando && resultado.datos.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-10 text-center text-slate-500">
                      No se encontraron pacientes.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-slate-200 px-6 py-4 text-sm text-slate-500">
          <span>{cargando ? 'Cargando...' : `${resultado.total} paciente(s)`}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={pagina <= 1}
              onClick={() => setPagina((p) => p - 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
            >
              Anterior
            </button>
            <span>
              {pagina} / {totalPaginas}
            </span>
            <button
              type="button"
              disabled={pagina >= totalPaginas}
              onClick={() => setPagina((p) => p + 1)}
              className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
