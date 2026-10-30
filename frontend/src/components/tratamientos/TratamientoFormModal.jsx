import { useState } from 'react'
import Modal from '../ui/Modal'
import { actualizarTratamiento, crearTratamiento } from '../../services/tratamientosService'

const claseInput =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

const DURACIONES = Array.from({ length: 32 }, (_, i) => (i + 1) * 15)

function Campo({ etiqueta, error, obligatorio = true, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta} {obligatorio && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export default function TratamientoFormModal({ tratamiento, categorias, onClose, onGuardado }) {
  const esEdicion = Boolean(tratamiento)
  const [formulario, setFormulario] = useState({
    codigo: tratamiento?.codigo ?? '',
    nombre: tratamiento?.nombre ?? '',
    categoria: tratamiento?.categoria ?? '',
    descripcion: tratamiento?.descripcion ?? '',
    precio: tratamiento?.precio ?? '',
    duracion_min: tratamiento?.duracion_min ?? 30,
    grava_iva: tratamiento?.grava_iva ?? false,
  })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiar = (e) => {
    const { name, value, type, checked } = e.target
    setFormulario((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
  }

  const borde = (campo) => (errores[campo] ? 'border-red-400' : 'border-slate-200')

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setMensaje('')
    const datos = { ...formulario, duracion_min: Number(formulario.duracion_min) }
    try {
      onGuardado(esEdicion ? await actualizarTratamiento(tratamiento.id, datos) : await crearTratamiento(datos))
    } catch (err) {
      setErrores(err.errores ?? {})
      setMensaje(err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <Modal titulo={esEdicion ? 'Editar tratamiento' : 'Nuevo tratamiento'} onClose={onClose}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {mensaje && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensaje}
          </p>
        )}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Campo etiqueta="Código" error={errores.codigo}>
            <input
              name="codigo"
              value={formulario.codigo}
              onChange={cambiar}
              placeholder="Ej.: OPE-003"
              maxLength={20}
              className={`${claseInput} uppercase placeholder:normal-case ${borde('codigo')}`}
            />
          </Campo>
          <div className="md:col-span-2">
            <Campo etiqueta="Nombre" error={errores.nombre}>
              <input name="nombre" value={formulario.nombre} onChange={cambiar} className={`${claseInput} ${borde('nombre')}`} />
            </Campo>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Campo etiqueta="Categoría" error={errores.categoria}>
            <select
              name="categoria"
              value={formulario.categoria}
              onChange={cambiar}
              className={`${claseInput} ${borde('categoria')}`}
            >
              <option value="">Seleccione...</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Campo>
          <Campo etiqueta="Precio (USD)" error={errores.precio}>
            <input
              type="number"
              name="precio"
              min="0"
              step="0.01"
              value={formulario.precio}
              onChange={cambiar}
              className={`${claseInput} ${borde('precio')}`}
            />
          </Campo>
          <Campo etiqueta="Duración estimada" error={errores.duracion_min}>
            <select
              name="duracion_min"
              value={formulario.duracion_min}
              onChange={cambiar}
              className={`${claseInput} ${borde('duracion_min')}`}
            >
              {DURACIONES.map((d) => (
                <option key={d} value={d}>
                  {d} min
                </option>
              ))}
            </select>
          </Campo>
        </div>

        <Campo etiqueta="Descripción" obligatorio={false}>
          <textarea
            name="descripcion"
            rows={2}
            value={formulario.descripcion}
            onChange={cambiar}
            className={`${claseInput} border-slate-200`}
          />
        </Campo>

        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            name="grava_iva"
            checked={formulario.grava_iva}
            onChange={cambiar}
            className="h-4 w-4 accent-teal-600"
          />
          Grava IVA (servicios estéticos u otros no exentos)
        </label>

        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={guardando}
            className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {guardando ? 'Guardando...' : 'Guardar tratamiento'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
