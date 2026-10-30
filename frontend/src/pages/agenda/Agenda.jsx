import { useEffect, useState } from 'react'
import CitaFormModal from '../../components/agenda/CitaFormModal'
import CitaDetalleModal from '../../components/agenda/CitaDetalleModal'
import EstadoBadge from '../../components/agenda/EstadoBadge'
import {
  COLORES_ODONTOLOGO,
  ESTADOS_CITA,
  ESTADOS_INACTIVOS,
  HORA_APERTURA,
  HORA_CIERRE,
} from '../../components/agenda/estadosCita'
import { listarCitas, listarOdontologos, listarSillones } from '../../services/agendaService'
import {
  formatearDiaSemana,
  formatearFechaCorta,
  formatearFechaLarga,
  horaDesdeMinutos,
  hoyISO,
  inicioSemana,
  minutosDesdeHora,
  sumarDias,
} from '../../utils/fechas'

const MINUTOS_SLOT = 30
const ALTO_SLOT = 44
const SLOTS = Array.from(
  { length: (HORA_CIERRE - HORA_APERTURA) / MINUTOS_SLOT },
  (_, i) => HORA_APERTURA + i * MINUTOS_SLOT,
)

const claseSelect =
  'rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

function TarjetaCita({ cita, vista, onClick }) {
  const top = ((minutosDesdeHora(cita.hora_inicio) - HORA_APERTURA) / MINUTOS_SLOT) * ALTO_SLOT
  const alto = (cita.duracion_min / MINUTOS_SLOT) * ALTO_SLOT - 3
  const inactiva = ESTADOS_INACTIVOS.includes(cita.estado)

  return (
    <button
      type="button"
      onClick={onClick}
      style={{ top, height: alto }}
      className={`absolute inset-x-1 z-10 overflow-hidden rounded-lg border-l-4 px-2 py-0.5 text-left text-xs leading-tight shadow-sm transition ${
        COLORES_ODONTOLOGO[cita.odontologo_color] ?? COLORES_ODONTOLOGO.teal
      } ${inactiva ? 'opacity-50' : ''}`}
    >
      <p className={`truncate font-semibold text-slate-800 ${inactiva ? 'line-through' : ''}`}>
        {cita.alertas.length > 0 && <span className="text-red-600">⚠ </span>}
        {cita.hora_inicio} {cita.paciente_nombre}
      </p>
      <p className="truncate text-slate-600">
        {vista === 'dia' ? cita.motivo : `${cita.sillon_nombre} · ${cita.motivo}`}
      </p>
      {cita.duracion_min >= 45 && <p className="truncate text-slate-500">{cita.odontologo_nombre}</p>}
      {cita.duracion_min >= 60 && (
        <div className="mt-0.5">
          <EstadoBadge estado={cita.estado} />
        </div>
      )}
    </button>
  )
}

export default function Agenda() {
  const [vista, setVista] = useState('dia')
  const [fecha, setFecha] = useState(hoyISO)
  const [sillonId, setSillonId] = useState('')
  const [odontologoId, setOdontologoId] = useState('')
  const [mostrarInactivas, setMostrarInactivas] = useState(false)
  const [catalogos, setCatalogos] = useState({ odontologos: [], sillones: [] })
  const [recarga, setRecarga] = useState(0)
  const [resultado, setResultado] = useState({ clave: null, citas: [], error: '' })
  const [modal, setModal] = useState(null)

  const desde = vista === 'dia' ? fecha : inicioSemana(fecha)
  const hasta = vista === 'dia' ? fecha : sumarDias(desde, 6)
  const clave = `${desde}|${hasta}|${sillonId}|${odontologoId}|${recarga}`
  const cargando = resultado.clave !== clave

  useEffect(() => {
    Promise.all([listarOdontologos(), listarSillones()])
      .then(([odontologos, sillones]) => setCatalogos({ odontologos, sillones }))
      .catch(() => {})
  }, [])

  useEffect(() => {
    let cancelado = false
    listarCitas({ desde, hasta, sillonId, odontologoId })
      .then((citas) => !cancelado && setResultado({ clave, citas, error: '' }))
      .catch((err) => !cancelado && setResultado({ clave, citas: [], error: err.message }))
    return () => {
      cancelado = true
    }
  }, [clave, desde, hasta, sillonId, odontologoId])

  const citas = resultado.citas.filter((c) => mostrarInactivas || !ESTADOS_INACTIVOS.includes(c.estado))

  const columnas =
    vista === 'dia'
      ? catalogos.sillones
          .filter((s) => !sillonId || s.id === Number(sillonId))
          .map((s) => ({
            id: `s${s.id}`,
            titulo: s.nombre,
            subtitulo: s.consultorio,
            citas: citas.filter((c) => c.sillon_id === s.id),
            inicial: { fecha, sillon_id: s.id },
          }))
      : Array.from({ length: 7 }, (_, i) => sumarDias(desde, i)).map((dia) => ({
          id: dia,
          titulo: formatearDiaSemana(dia),
          esHoy: dia === hoyISO(),
          citas: citas.filter((c) => c.fecha === dia),
          inicial: { fecha: dia, sillon_id: sillonId },
        }))

  const mover = (direccion) => setFecha((f) => sumarDias(f, direccion * (vista === 'dia' ? 1 : 7)))

  const recargar = () => setRecarga((r) => r + 1)

  const titulo =
    vista === 'dia' ? formatearFechaLarga(fecha) : `${formatearFechaCorta(desde)} – ${formatearFechaCorta(hasta)}`

  const nuevaCita = (inicial = {}) =>
    setModal({ tipo: 'nueva', inicial: { fecha, odontologo_id: odontologoId, sillon_id: sillonId, ...inicial } })

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Agenda de citas</h1>
          <p className="mt-2 text-sm text-slate-500">Turnos por sillón dental y odontólogo.</p>
        </div>
        <button
          type="button"
          onClick={() => nuevaCita()}
          className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
        >
          + Nueva cita
        </button>
      </section>

      <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => mover(-1)} className={claseSelect} aria-label="Anterior">
            ←
          </button>
          <button type="button" onClick={() => setFecha(hoyISO())} className={`${claseSelect} font-semibold`}>
            Hoy
          </button>
          <button type="button" onClick={() => mover(1)} className={claseSelect} aria-label="Siguiente">
            →
          </button>
          <input
            type="date"
            value={fecha}
            onChange={(e) => e.target.value && setFecha(e.target.value)}
            className={claseSelect}
          />
          <h2 className="ml-2 text-lg font-bold capitalize text-slate-800">{titulo}</h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl border border-slate-200 p-1">
            {[
              ['dia', 'Día'],
              ['semana', 'Semana'],
            ].map(([valor, etiqueta]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setVista(valor)}
                className={`rounded-lg px-4 py-1.5 text-sm font-semibold transition ${
                  vista === valor ? 'bg-teal-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <select value={sillonId} onChange={(e) => setSillonId(e.target.value)} className={claseSelect}>
            <option value="">Todos los sillones</option>
            {catalogos.sillones.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nombre}
              </option>
            ))}
          </select>
          <select value={odontologoId} onChange={(e) => setOdontologoId(e.target.value)} className={claseSelect}>
            <option value="">Todos los odontólogos</option>
            {catalogos.odontologos.map((o) => (
              <option key={o.id} value={o.id}>
                {o.nombres} {o.apellidos}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-2 px-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={mostrarInactivas}
              onChange={(e) => setMostrarInactivas(e.target.checked)}
              className="h-4 w-4 accent-teal-600"
            />
            Ver canceladas / no asistió
          </label>
        </div>
      </section>

      {resultado.error && (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{resultado.error}</p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="max-h-[70vh] overflow-auto">
          <div className="min-w-[720px]">
            <div className="sticky top-0 z-20 flex border-b border-slate-200 bg-slate-50">
              <div className="w-16 shrink-0" />
              {columnas.map((col) => (
                <div
                  key={col.id}
                  className={`flex-1 border-l border-slate-200 px-3 py-3 text-center ${col.esHoy ? 'bg-teal-50' : ''}`}
                >
                  <p className={`text-sm font-semibold capitalize ${col.esHoy ? 'text-teal-700' : 'text-slate-700'}`}>
                    {col.titulo}
                  </p>
                  {col.subtitulo && <p className="text-xs text-slate-500">{col.subtitulo}</p>}
                </div>
              ))}
            </div>

            <div className="flex">
              <div className="w-16 shrink-0">
                {SLOTS.map((minutos) => (
                  <div key={minutos} style={{ height: ALTO_SLOT }} className="pr-2 pt-1 text-right text-xs text-slate-400">
                    {minutos % 60 === 0 ? horaDesdeMinutos(minutos) : ''}
                  </div>
                ))}
              </div>

              {columnas.map((col) => (
                <div key={col.id} className="relative flex-1 border-l border-slate-200">
                  {SLOTS.map((minutos) => (
                    <button
                      key={minutos}
                      type="button"
                      title={`Agendar a las ${horaDesdeMinutos(minutos)}`}
                      onClick={() => nuevaCita({ ...col.inicial, hora_inicio: horaDesdeMinutos(minutos) })}
                      style={{ height: ALTO_SLOT }}
                      className={`block w-full border-b hover:bg-teal-50/60 ${
                        minutos % 60 === 0 ? 'border-slate-100' : 'border-dashed border-slate-100'
                      }`}
                    />
                  ))}
                  {col.citas.map((cita) => (
                    <TarjetaCita
                      key={cita.id}
                      cita={cita}
                      vista={vista}
                      onClick={() => setModal({ tipo: 'detalle', cita })}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-6 py-3 text-xs text-slate-500">
          <span>{cargando ? 'Cargando...' : `${citas.length} cita(s)`}</span>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ESTADOS_CITA).map((estado) => (
              <EstadoBadge key={estado} estado={estado} />
            ))}
          </div>
        </div>
      </div>

      {modal?.tipo === 'detalle' && (
        <CitaDetalleModal
          cita={modal.cita}
          onClose={() => setModal(null)}
          onEditar={() => setModal({ tipo: 'editar', cita: modal.cita })}
          onActualizada={(cita) => {
            setModal({ tipo: 'detalle', cita })
            recargar()
          }}
        />
      )}

      {(modal?.tipo === 'nueva' || modal?.tipo === 'editar') && (
        <CitaFormModal
          cita={modal.cita}
          inicial={modal.inicial}
          odontologos={catalogos.odontologos}
          sillones={catalogos.sillones}
          onClose={() => setModal(null)}
          onGuardado={(cita) => {
            setModal(null)
            setFecha(cita.fecha)
            recargar()
          }}
        />
      )}
    </div>
  )
}
