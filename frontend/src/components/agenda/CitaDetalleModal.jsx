import { useState } from 'react'
import { Link } from 'react-router-dom'
import Modal from '../ui/Modal'
import AlertasMedicas from '../pacientes/AlertasMedicas'
import EstadoBadge from './EstadoBadge'
import { ESTADOS_CITA, ESTADOS_EDITABLES, TRANSICIONES } from './estadosCita'
import { cambiarEstadoCita } from '../../services/agendaService'
import { formatearFechaLarga } from '../../utils/fechas'

function Dato({ etiqueta, children }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="mt-1 text-sm text-slate-800">{children || '—'}</dd>
    </div>
  )
}

const ESTILO_BOTON = {
  Cancelado: 'border-red-200 text-red-700 hover:bg-red-50',
  'No asistió': 'border-slate-200 text-slate-600 hover:bg-slate-50',
}

export default function CitaDetalleModal({ cita, onClose, onActualizada, onEditar }) {
  const [cancelando, setCancelando] = useState(false)
  const [motivoCancelacion, setMotivoCancelacion] = useState('')
  const [error, setError] = useState('')
  const [procesando, setProcesando] = useState(false)

  const cambiarEstado = async (estado) => {
    if (estado === 'Cancelado' && !cancelando) return setCancelando(true)
    setProcesando(true)
    setError('')
    try {
      onActualizada(await cambiarEstadoCita(cita.id, estado, motivoCancelacion))
      setCancelando(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setProcesando(false)
    }
  }

  const transiciones = TRANSICIONES[cita.estado]

  return (
    <Modal titulo="Detalle de la cita" onClose={onClose}>
      <div className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <Link to={`/pacientes/${cita.paciente_id}`} className="text-xl font-bold text-slate-800 hover:text-teal-700">
              {cita.paciente_nombre}
            </Link>
            <p className="text-sm text-slate-500">
              C.I. {cita.paciente_cedula} · Tel. {cita.paciente_telefono}
            </p>
          </div>
          <EstadoBadge estado={cita.estado} />
        </div>

        <AlertasMedicas alertas={cita.alertas} />

        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Dato etiqueta="Fecha">
            <span className="capitalize">{formatearFechaLarga(cita.fecha)}</span>
          </Dato>
          <Dato etiqueta="Horario">
            {cita.hora_inicio} – {cita.hora_fin} ({cita.duracion_min} min)
          </Dato>
          <Dato etiqueta="Odontólogo">{cita.odontologo_nombre}</Dato>
          <Dato etiqueta="Sillón">{cita.sillon_nombre}</Dato>
          <Dato etiqueta="Motivo">{cita.motivo}</Dato>
          <Dato etiqueta="Observaciones">{cita.observaciones}</Dato>
          {cita.motivo_cancelacion && <Dato etiqueta="Motivo de cancelación">{cita.motivo_cancelacion}</Dato>}
        </dl>

        {error && <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        {cancelando && (
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium text-slate-700">
              Motivo de la cancelación <span className="text-red-500">*</span>
            </span>
            <textarea
              rows={2}
              value={motivoCancelacion}
              onChange={(e) => setMotivoCancelacion(e.target.value)}
              autoFocus
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            />
          </label>
        )}

        {cita.estado === 'Atendido' && (
          <div className="flex justify-end border-t border-slate-200 pt-4">
            <Link
              to={`/facturacion/nueva?cita=${cita.id}`}
              className="rounded-xl bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700"
            >
              Facturar cita
            </Link>
          </div>
        )}

        {(transiciones.length > 0 || ESTADOS_EDITABLES.includes(cita.estado)) && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4">
            {ESTADOS_EDITABLES.includes(cita.estado) && !cancelando && (
              <button
                type="button"
                onClick={onEditar}
                className="mr-auto rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Editar / reprogramar
              </button>
            )}
            {cancelando ? (
              <>
                <button
                  type="button"
                  onClick={() => setCancelando(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Volver
                </button>
                <button
                  type="button"
                  disabled={procesando}
                  onClick={() => cambiarEstado('Cancelado')}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
                >
                  Confirmar cancelación
                </button>
              </>
            ) : (
              transiciones.map((estado) => (
                <button
                  key={estado}
                  type="button"
                  disabled={procesando}
                  onClick={() => cambiarEstado(estado)}
                  className={`rounded-xl border px-4 py-2 text-sm font-semibold disabled:opacity-60 ${
                    ESTILO_BOTON[estado] ?? 'border-teal-600 bg-teal-600 text-white hover:bg-teal-700'
                  }`}
                >
                  {ESTADOS_CITA[estado].accion}
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}
