import { useEffect, useState } from 'react'
import TratamientoFormModal from '../../components/tratamientos/TratamientoFormModal'
import {
  cambiarActivoTratamiento,
  listarCategorias,
  listarTratamientos,
} from '../../services/tratamientosService'
import { formatearMoneda } from '../../utils/moneda'

const claseFiltro =
  'rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

export default function TratamientosList() {
  const [buscar, setBuscar] = useState('')
  const [categoria, setCategoria] = useState('')
  const [incluirInactivos, setIncluirInactivos] = useState(false)
  const [categorias, setCategorias] = useState([])
  const [recarga, setRecarga] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, datos: [], error: '' })
  const [modal, setModal] = useState(null)
  const [errorAccion, setErrorAccion] = useState('')

  const clave = `${buscar}|${categoria}|${incluirInactivos}|${recarga}`
  const cargando = resultado.clave !== clave

  useEffect(() => {
    listarCategorias().then(setCategorias).catch(() => {})
  }, [])

  useEffect(() => {
    let cancelado = false
    const temporizador = setTimeout(() => {
      listarTratamientos({ buscar: buscar.trim(), categoria, incluirInactivos })
        .then((datos) => !cancelado && setResultado({ clave, datos, error: '' }))
        .catch((err) => !cancelado && setResultado({ clave, datos: [], error: err.message }))
    }, 300)
    return () => {
      cancelado = true
      clearTimeout(temporizador)
    }
  }, [clave, buscar, categoria, incluirInactivos])

  const recargar = () => setRecarga((r) => r + 1)

  const alternarActivo = async (tratamiento) => {
    setErrorAccion('')
    try {
      await cambiarActivoTratamiento(tratamiento.id, !tratamiento.activo)
      recargar()
    } catch (err) {
      setErrorAccion(err.message)
    }
  }

  const error = resultado.error || errorAccion

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Catálogo de tratamientos</h1>
          <p className="mt-2 text-sm text-slate-500">Servicios odontológicos, precios y duración estimada.</p>
        </div>
        <button
          type="button"
          onClick={() => setModal({})}
          className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          + Nuevo tratamiento
        </button>
      </section>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4">
          <input
            type="search"
            value={buscar}
            onChange={(e) => setBuscar(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className={`${claseFiltro} min-w-60 flex-1`}
          />
          <select value={categoria} onChange={(e) => setCategoria(e.target.value)} className={claseFiltro}>
            <option value="">Todas las categorías</option>
            {categorias.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={incluirInactivos}
              onChange={(e) => setIncluirInactivos(e.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
            Ver inactivos
          </label>
        </div>

        {error && <p className="border-b border-red-200 bg-red-50 px-6 py-3 text-sm text-red-700">{error}</p>}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-6 py-3 font-semibold">Código</th>
                <th className="px-6 py-3 font-semibold">Tratamiento</th>
                <th className="px-6 py-3 font-semibold">Categoría</th>
                <th className="px-6 py-3 text-right font-semibold">Duración</th>
                <th className="px-6 py-3 text-right font-semibold">Precio</th>
                <th className="px-6 py-3 font-semibold">Estado</th>
                <th className="px-6 py-3 text-right font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resultado.datos.map((t) => (
                <tr key={t.id} className={t.activo ? 'hover:bg-slate-50' : 'bg-slate-50/60 text-slate-400'}>
                  <td className="px-6 py-3 font-mono text-xs font-semibold">{t.codigo}</td>
                  <td className="px-6 py-3">
                    <p className={`font-medium ${t.activo ? 'text-slate-800' : ''}`}>{t.nombre}</p>
                    {t.descripcion && <p className="text-xs text-slate-500">{t.descripcion}</p>}
                  </td>
                  <td className="px-6 py-3">
                    <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                      {t.categoria}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">{t.duracion_min} min</td>
                  <td className="px-6 py-3 text-right font-semibold">
                    {formatearMoneda(t.precio)}
                    {t.grava_iva && <span className="ml-1 text-xs font-normal text-slate-500">+ IVA</span>}
                  </td>
                  <td className="px-6 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        t.activo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {t.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="space-x-3 whitespace-nowrap px-6 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => setModal({ tratamiento: t })}
                      className="text-sm font-semibold text-teal-700 hover:text-teal-800"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarActivo(t)}
                      className={`text-sm font-semibold ${t.activo ? 'text-slate-500 hover:text-red-600' : 'text-emerald-700'}`}
                    >
                      {t.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </td>
                </tr>
              ))}
              {!cargando && resultado.datos.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    No hay tratamientos que coincidan con la búsqueda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
          {cargando ? 'Cargando...' : `${resultado.datos.length} tratamiento(s)`}
        </div>
      </div>

      {modal && (
        <TratamientoFormModal
          tratamiento={modal.tratamiento}
          categorias={categorias}
          onClose={() => setModal(null)}
          onGuardado={() => {
            setModal(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}
