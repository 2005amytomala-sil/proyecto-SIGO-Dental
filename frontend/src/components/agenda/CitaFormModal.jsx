import { useEffect, useState } from 'react'
import Modal from '../ui/Modal'
import { AlertasBadge } from '../pacientes/AlertasMedicas'
import { listarPacientes } from '../../services/pacientesService'
import { actualizarCita, crearCita } from '../../services/agendaService'
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

function BuscadorPaciente({ paciente, onSeleccionar, error }) {
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
              {select('duracion_min', DURACIONES.map((d) => <option key={d} value={d}>{d} min</option>))}
            </Campo>
          </div>
        </div>

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
