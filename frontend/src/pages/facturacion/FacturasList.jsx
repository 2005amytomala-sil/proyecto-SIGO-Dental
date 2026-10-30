import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { listarFacturas } from '../../services/facturacionService'
import { formatearMoneda } from '../../utils/moneda'
import { hoyISO } from '../../utils/fechas'

const LIMITE = 10
const claseInput =
  'rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

export function EstadoFactura({ estado }) {
  const clase = estado === 'Anulada' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'
  return <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${clase}`}>{estado}</span>
}

export default function FacturasList() {
  const navigate = useNavigate()
  const [filtros, setFiltros] = useState({ desde: `${hoyISO().slice(0, 8)}01`, hasta: hoyISO(), buscar: '', estado: '' })
  const [pagina, setPagina] = useState(1)
  const [resultado, setResultado] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let activo = true
    const temporizador = setTimeout(() => {
      listarFacturas({ ...filtros, pagina, limite: LIMITE })
        .then((datos) => {
          if (!activo) return
          setResultado(datos)
          setError('')
        })
        .catch((err) => activo && setError(err.message))
    }, 250)
    return () => {
      activo = false
      clearTimeout(temporizador)
    }
  }, [filtros, pagina])

  const cambiarFiltro = (campo) => (e) => {
    setFiltros((actual) => ({ ...actual, [campo]: e.target.value }))
    setPagina(1)
  }

  const totalPaginas = resultado ? Math.max(Math.ceil(resultado.total / LIMITE), 1) : 1

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Facturación</h1>
          <p className="text-sm text-slate-500">Cobros, comprobantes y pagos mixtos</p>
        </div>
        <Link to="/facturacion/nueva" className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700">
          + Nueva factura
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Total cobrado</p>
          <p className="mt-1 text-2xl font-bold text-teal-700">{formatearMoneda(resultado?.resumen.total)}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Facturas emitidas</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">{resultado?.resumen.cantidad ?? 0}</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm text-slate-500">Por forma de pago</p>
          <div className="mt-2 space-y-1 text-sm">
            {resultado?.resumen.por_metodo.length ? (
              resultado.resumen.por_metodo.map((m) => (
                <div key={m.metodo} className="flex justify-between">
                  <span className="text-slate-600">{m.metodo}</span>
                  <span className="font-semibold text-slate-800">{formatearMoneda(m.monto)}</span>
                </div>
              ))
            ) : (
              <p className="text-slate-400">Sin cobros en el período</p>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4">
        <label className="text-xs font-semibold text-slate-500">
          Desde
          <input type="date" value={filtros.desde} onChange={cambiarFiltro('desde')} className={`${claseInput} mt-1 block`} />
        </label>
        <label className="text-xs font-semibold text-slate-500">
          Hasta
          <input type="date" value={filtros.hasta} onChange={cambiarFiltro('hasta')} className={`${claseInput} mt-1 block`} />
        </label>
        <input
          value={filtros.buscar}
          onChange={cambiarFiltro('buscar')}
          placeholder="Buscar por número, cliente o paciente"
          className={`${claseInput} min-w-64 flex-1`}
        />
        <select value={filtros.estado} onChange={cambiarFiltro('estado')} className={claseInput}>
          <option value="">Todos los estados</option>
          <option value="Emitida">Emitida</option>
          <option value="Anulada">Anulada</option>
        </select>
      </div>

      {error && <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>}

      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-5 py-3">Número</th>
              <th className="px-5 py-3">Fecha</th>
              <th className="px-5 py-3">Cliente</th>
              <th className="px-5 py-3">Paciente</th>
              <th className="px-5 py-3 text-right">Total</th>
              <th className="px-5 py-3">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {resultado?.datos.map((f) => (
              <tr key={f.id} onClick={() => navigate(`/facturacion/${f.id}`)} className="cursor-pointer hover:bg-slate-50">
                <td className="px-5 py-3 font-mono font-semibold text-slate-800">{f.numero}</td>
                <td className="px-5 py-3 text-slate-600">{f.fecha}</td>
                <td className="px-5 py-3">
                  <p className="font-medium text-slate-800">{f.cliente_nombre}</p>
                  <p className="text-xs text-slate-500">{f.cliente_identificacion}</p>
                </td>
                <td className="px-5 py-3 text-slate-600">{f.paciente_nombre}</td>
                <td className="px-5 py-3 text-right font-semibold text-slate-800">{formatearMoneda(f.total)}</td>
                <td className="px-5 py-3"><EstadoFactura estado={f.estado} /></td>
              </tr>
            ))}
            {resultado?.datos.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-slate-400">No hay facturas con esos filtros</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-slate-500">
        <span>{resultado?.total ?? 0} facturas</span>
        <div className="flex items-center gap-2">
          <button disabled={pagina <= 1} onClick={() => setPagina(pagina - 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">
            Anterior
          </button>
          <span>Página {pagina} de {totalPaginas}</span>
          <button disabled={pagina >= totalPaginas} onClick={() => setPagina(pagina + 1)} className="rounded-lg border border-slate-200 px-3 py-1.5 disabled:opacity-40">
            Siguiente
          </button>
        </div>
      </div>
    </div>
  )
}
