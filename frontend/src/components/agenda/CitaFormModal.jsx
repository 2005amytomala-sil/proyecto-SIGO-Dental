import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import BuscadorPaciente from '../pacientes/BuscadorPaciente'
import { actualizarCita, crearCita } from '../../services/agendaService'
import { listarTratamientos } from '../../services/tratamientosService'
import { formatearMoneda } from '../../utils/moneda'
import { horaDesdeMinutos } from '../../utils/fechas'
import { HORA_APERTURA, HORA_CIERRE } from './estadosCita'

const DURACIONES = [15, 30, 45, 60, 90, 120, 180, 240]
const HORAS = Array.from({ length: (HORA_CIERRE - HORA_APERTURA) / 15 }, (_, i) => horaDesdeMinutos(HORA_APERTURA + i * 15))

const claseInput =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

function Campo({ etiqueta, error, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta} <span className="text-red-500">*</span>
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

export default function CitaFormModal({ cita, inicial = {}, odontologos, sillones, onClose, onGuardado }) {
  const esEdicion = Boolean(cita)
  const [paciente, setPaciente] = useState(
    cita
      ? { id: cita.paciente_id, nombre: cita.paciente_nombre, cedula: cita.paciente_cedula, alertas: cita.alertas }
      : null,
  )
  const [formulario, setFormulario] = useState({
    odontologo_id: cita?.odontologo_id ?? inicial.odontologo_id ?? '',
    sillon_id: cita?.sillon_id ?? inicial.sillon_id ?? '',
    fecha: cita?.fecha ?? inicial.fecha ?? '',
    hora_inicio: cita?.hora_inicio ?? inicial.hora_inicio ?? '09:00',
    duracion_min: cita?.duracion_min ?? 30,
    motivo: cita?.motivo ?? '',
    observaciones: cita?.observaciones ?? '',
  })
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [tratamientos, setTratamientos] = useState([])

  useEffect(() => {
    listarTratamientos().then(setTratamientos).catch(() => {})
  }, [])

  const duraciones = [...new Set([...DURACIONES, Number(formulario.duracion_min)])].sort((a, b) => a - b)

  const elegirTratamiento = (e) => {
    const tratamiento = tratamientos.find((t) => t.id === Number(e.target.value))
    if (tratamiento) {
      setFormulario((f) => ({ ...f, motivo: tratamiento.nombre, duracion_min: tratamiento.duracion_min }))
    }
  }

  const cambiar = (e) => setFormulario((f) => ({ ...f, [e.target.name]: e.target.value }))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setMensaje('')
    const datos = { ...formulario, paciente_id: paciente?.id, duracion_min: Number(formulario.duracion_min) }
    try {
      const guardada = esEdicion ? await actualizarCita(cita.id, datos) : await crearCita(datos)
      onGuardado(guardada)
    } catch (err) {
      setErrores(err.errores ?? {})
      setMensaje(err.message)
    } finally {
      setGuardando(false)
    }
  }

  const select = (name, opciones) => (
    <select
      name={name}
      value={formulario[name]}
      onChange={cambiar}
      className={`${claseInput} ${errores[name] ? 'border-red-400' : 'border-slate-200'}`}
    >
      {opciones}
    </select>
  )

  return (
    <Modal titulo={esEdicion ? 'Editar / reprogramar cita' : 'Nueva cita'} onClose={onClose}>
      <form onSubmit={guardar} noValidate className="space-y-4">
        {mensaje && (
          <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {mensaje}
          </p>
        )}

        <Campo etiqueta="Paciente" error={errores.paciente_id}>
          <BuscadorPaciente paciente={paciente} onSeleccionar={setPaciente} error={errores.paciente_id} />
        </Campo>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Campo etiqueta="Odontólogo" error={errores.odontologo_id}>
            {select('odontologo_id', [
              <option key="" value="">Seleccione...</option>,
              ...odontologos.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombres} {o.apellidos} · {o.especialidad}
                </option>
              )),
            ])}
          </Campo>
          <Campo etiqueta="Sillón" error={errores.sillon_id}>
            {select('sillon_id', [
              <option key="" value="">Seleccione...</option>,
              ...sillones.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nombre} · {s.consultorio}
                </option>
              )),
            ])}
          </Campo>
          <Campo etiqueta="Fecha" error={errores.fecha}>
            <input
              type="date"
              name="fecha"
              value={formulario.fecha}
              onChange={cambiar}
              className={`${claseInput} ${errores.fecha ? 'border-red-400' : 'border-slate-200'}`}
            />
          </Campo>
          <div className="grid grid-cols-2 gap-4">
            <Campo etiqueta="Hora" error={errores.hora_inicio}>
              {select('hora_inicio', HORAS.map((h) => <option key={h} value={h}>{h}</option>))}
            </Campo>
            <Campo etiqueta="Duración" error={errores.duracion_min}>
              {select('duracion_min', duraciones.map((d) => <option key={d} value={d}>{d} min</option>))}
            </Campo>
          </div>
        </div>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Tratamiento del catálogo</span>
          <select defaultValue="" onChange={elegirTratamiento} className={`${claseInput} border-slate-200`}>
            <option value="">Opcional: completa el motivo y la duración...</option>
            {tratamientos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.codigo} · {t.nombre} ({t.duracion_min} min · {formatearMoneda(t.precio)})
              </option>
            ))}
          </select>
        </label>

        <Campo etiqueta="Motivo / tratamiento" error={errores.motivo}>
          <input
            name="motivo"
            value={formulario.motivo}
            onChange={cambiar}
            placeholder="Ej.: limpieza dental, control de ortodoncia..."
            className={`${claseInput} ${errores.motivo ? 'border-red-400' : 'border-slate-200'}`}
          />
        </Campo>

        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-slate-700">Observaciones</span>
          <textarea
            name="observaciones"
            rows={2}
            value={formulario.observaciones}
            onChange={cambiar}
            className={`${claseInput} border-slate-200`}
          />
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
            {guardando ? 'Guardando...' : 'Guardar cita'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
