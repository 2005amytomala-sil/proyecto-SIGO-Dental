import { useEffect, useState } from 'react'
import { AlertasBadge } from './AlertasMedicas'
import { listarPacientes } from '../../services/pacientesService'

const claseInput =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

export default function BuscadorPaciente({ paciente, onSeleccionar, error }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState([])

  useEffect(() => {
    const temporizador = setTimeout(() => {
      if (!texto.trim()) return setResultados([])
      listarPacientes({ buscar: texto.trim(), limite: 6 })
        .then(({ datos }) => setResultados(datos))
        .catch(() => setResultados([]))
    }, 300)
    return () => clearTimeout(temporizador)
  }, [texto])

  if (paciente) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{paciente.nombre}</p>
          <p className="text-xs text-slate-500">C.I. {paciente.cedula}</p>
        </div>
        <div className="flex shrink-0 items-center gap-3">
          <AlertasBadge alertas={paciente.alertas} />
          <button type="button" onClick={() => onSeleccionar(null)} className="text-xs font-semibold text-teal-700">
            Cambiar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <input
        type="search"
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        placeholder="Buscar paciente por cédula o nombre..."
        className={`${claseInput} ${error ? 'border-red-400' : 'border-slate-200'}`}
        autoFocus
      />
      {texto.trim() && resultados.length > 0 && (
        <ul className="absolute z-10 mt-1 max-h-60 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
          {resultados.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() =>
                  onSeleccionar({ id: p.id, nombre: `${p.nombres} ${p.apellidos}`, cedula: p.cedula, alertas: p.alertas })
                }
                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-sm hover:bg-slate-50"
              >
                <span>
                  <span className="font-medium text-slate-800">
                    {p.apellidos}, {p.nombres}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">{p.cedula}</span>
                </span>
                <AlertasBadge alertas={p.alertas} />
              </button>
            </li>
          ))}
        </ul>
      )}
      {texto.trim() && resultados.length === 0 && (
        <p className="mt-1 text-xs text-slate-500">Sin resultados. Registre primero al paciente en el módulo Pacientes.</p>
      )}
    </div>
  )
}
