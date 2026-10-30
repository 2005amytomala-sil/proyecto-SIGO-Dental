import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AlertasMedicas from '../../components/pacientes/AlertasMedicas'
import Diente from '../../components/odontograma/Diente'
import Modal from '../../components/ui/Modal'
import { obtenerPaciente } from '../../services/pacientesService'
import {
  anularRegistroOdontograma,
  crearRegistroOdontograma,
  obtenerCatalogoHallazgos,
  obtenerOdontograma,
} from '../../services/odontogramaService'
import {
  ARCADAS,
  COLOR_SELLANTE,
  COLORES_ESTADO,
  denticionPorEdad,
  nombreDiente,
  nombreSuperficie,
  numeroDiente,
} from '../../utils/dientes'

const SUPERFICIES = ['V', 'L', 'M', 'D', 'O']
const claseInput =
  'w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

function Opcion({ activa, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-semibold ${activa ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
    >
      {children}
    </button>
  )
}

function FilaDientes({ filas, ...props }) {
  return (
    <div className="flex justify-center gap-2">
      {filas.map((fila, i) => (
        <div key={i} className={`flex gap-0.5 ${i === 0 ? 'border-r-2 border-slate-300 pr-2' : ''}`}>
          {fila.map((diente) => (
            <Diente key={diente} diente={diente} {...props} registros={props.registrosDe(diente)} />
          ))}
        </div>
      ))}
    </div>
  )
}

function FormularioRegistro({ pacienteId, seleccion, catalogo, onGuardado }) {
  const inicial = catalogo.find((h) => h.codigo === (seleccion.superficie ? 'caries' : 'endodoncia'))
  const [hallazgo, setHallazgo] = useState(inicial)
  const [estado, setEstado] = useState(inicial.estados[0])
  const [superficies, setSuperficies] = useState(seleccion.superficie ? [seleccion.superficie] : [])
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const cambiarHallazgo = (codigo) => {
    const nuevo = catalogo.find((h) => h.codigo === codigo)
    setHallazgo(nuevo)
    setEstado(nuevo.estados[0])
  }

  const alternarSuperficie = (s) =>
    setSuperficies((actual) => (actual.includes(s) ? actual.filter((x) => x !== s) : [...actual, s]))

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setError('')
    try {
      await crearRegistroOdontograma(pacienteId, {
        diente: seleccion.diente,
        hallazgo: hallazgo.codigo,
        estado,
        superficies,
        notas,
      })
      setNotas('')
      onGuardado()
    } catch (err) {
      setError(Object.values(err.errores ?? {})[0] ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-3">
      <label className="block text-xs font-semibold text-slate-500">
        Hallazgo o procedimiento
        <select value={hallazgo.codigo} onChange={(e) => cambiarHallazgo(e.target.value)} className={`${claseInput} mt-1`}>
          <optgroup label="Por superficie">
            {catalogo.filter((h) => h.tipo === 'superficie').map((h) => <option key={h.codigo} value={h.codigo}>{h.nombre}</option>)}
          </optgroup>
          <optgroup label="Diente completo">
            {catalogo.filter((h) => h.tipo === 'diente').map((h) => <option key={h.codigo} value={h.codigo}>{h.nombre}</option>)}
          </optgroup>
        </select>
      </label>

      {hallazgo.tipo === 'superficie' && (
        <div>
          <p className="text-xs font-semibold text-slate-500">Superficies</p>
          <div className="mt-1 flex flex-wrap gap-2">
            {SUPERFICIES.map((s) => (
              <label
                key={s}
                className={`cursor-pointer rounded-lg border px-2.5 py-1 text-xs font-semibold ${superficies.includes(s) ? 'border-teal-500 bg-teal-50 text-teal-700' : 'border-slate-200 text-slate-500'}`}
              >
                <input type="checkbox" className="hidden" checked={superficies.includes(s)} onChange={() => alternarSuperficie(s)} />
                {nombreSuperficie(s, seleccion.diente)}
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        {hallazgo.estados.map((e) => (
          <label
            key={e}
            className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-center text-xs font-semibold ${estado === e ? 'text-white' : 'border-slate-200 text-slate-500'}`}
            style={estado === e ? { backgroundColor: COLORES_ESTADO[e], borderColor: COLORES_ESTADO[e] } : undefined}
          >
            <input type="radio" className="hidden" checked={estado === e} onChange={() => setEstado(e)} />
            {e === 'Requerido' ? 'Por realizar' : 'Existente / realizado'}
          </label>
        ))}
      </div>

      <textarea value={notas} onChange={(e) => setNotas(e.target.value)} rows={2} placeholder="Notas (opcional)" className={claseInput} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={guardando} className="w-full rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">
        {guardando ? 'Guardando…' : 'Registrar'}
      </button>
    </form>
  )
}

function ModalAnular({ registro, onClose, onAnulado }) {
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState('')

  const confirmar = async (e) => {
    e.preventDefault()
    try {
      await anularRegistroOdontograma(registro.id, motivo)
      onAnulado()
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <Modal titulo="Anular registro" onClose={onClose} ancho="max-w-lg">
      <form onSubmit={confirmar} className="space-y-4">
        <p className="text-sm text-slate-600">El registro no se borra: queda en el historial como anulado junto con el motivo.</p>
        <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={3} placeholder="Motivo de la anulación" className={claseInput} />
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <div className="flex justify-end gap-3">
          <button type="button" onClick={onClose} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600">Volver</button>
          <button type="submit" className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Anular</button>
        </div>
      </form>
    </Modal>
  )
}

function Leyenda() {
  const muestra = (color) => <span className="inline-block h-3 w-3 rounded-sm border border-slate-300" style={{ backgroundColor: color }} />
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
      <span className="flex items-center gap-1.5">{muestra(COLORES_ESTADO.Requerido)} Caries / por realizar</span>
      <span className="flex items-center gap-1.5">{muestra(COLORES_ESTADO.Existente)} Restauración / existente</span>
      <span className="flex items-center gap-1.5">{muestra(COLOR_SELLANTE)} Sellante</span>
      <span>✕ Exodoncia / ausente</span>
      <span>◯ Corona</span>
      <span>│ Endodoncia</span>
      <span>┄ Prótesis removible</span>
      <span>IM Implante</span>
    </div>
  )
}

export default function Odontograma() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [catalogo, setCatalogo] = useState([])
  const [registros, setRegistros] = useState([])
  const [notacion, setNotacion] = useState('fdi')
  const [denticion, setDenticion] = useState('permanente')
  const [seleccion, setSeleccion] = useState(null)
  const [anulando, setAnulando] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([obtenerPaciente(id), obtenerCatalogoHallazgos(), obtenerOdontograma(id)])
      .then(([datosPaciente, hallazgos, datosRegistros]) => {
        setPaciente(datosPaciente)
        setCatalogo(hallazgos)
        setRegistros(datosRegistros)
        setDenticion(denticionPorEdad(datosPaciente.edad))
      })
      .catch((err) => setError(err.message))
  }, [id])

  const recargar = () => obtenerOdontograma(id).then(setRegistros).catch((err) => setError(err.message))

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!paciente) return <p className="text-sm text-slate-500">Cargando…</p>

  const activos = registros.filter((r) => !r.anulado)
  const registrosDe = (diente) => activos.filter((r) => r.diente === diente)
  const nombreHallazgo = (codigo) => catalogo.find((h) => h.codigo === codigo)?.nombre ?? codigo
  const pendientes = activos.filter((r) => r.estado === 'Requerido').length
  const propsFila = { notacion, seleccion, onSeleccionar: setSeleccion, registrosDe }
  const describir = (r) => `${nombreHallazgo(r.hallazgo)}${r.superficie ? ` · ${nombreSuperficie(r.superficie, r.diente)}` : ''}`

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link to={`/pacientes/${paciente.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Ficha del paciente</Link>
          <h1 className="mt-1 text-2xl font-bold text-slate-800">Odontograma · {paciente.nombres} {paciente.apellidos}</h1>
          <p className="text-sm text-slate-500">C.I. {paciente.cedula} · {paciente.edad} años · {pendientes} tratamiento(s) por realizar</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-xl bg-slate-100 p-1">
            <Opcion activa={denticion === 'permanente'} onClick={() => setDenticion('permanente')}>Permanente</Opcion>
            <Opcion activa={denticion === 'mixta'} onClick={() => setDenticion('mixta')}>Mixta</Opcion>
            <Opcion activa={denticion === 'temporal'} onClick={() => setDenticion('temporal')}>Temporal</Opcion>
          </div>
          <div className="flex rounded-xl bg-slate-100 p-1">
            <Opcion activa={notacion === 'fdi'} onClick={() => setNotacion('fdi')}>FDI</Opcion>
            <Opcion activa={notacion === 'universal'} onClick={() => setNotacion('universal')}>Universal</Opcion>
          </div>
        </div>
      </div>

      <AlertasMedicas alertas={paciente.alertas} />

      <section className="space-y-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6">
        <div className="min-w-max space-y-3">
          {denticion !== 'temporal' && <FilaDientes filas={ARCADAS.permanente.superior} {...propsFila} />}
          {denticion !== 'permanente' && <FilaDientes filas={ARCADAS.temporal.superior} {...propsFila} />}
          <div className="border-t-2 border-dashed border-slate-200" />
          {denticion !== 'permanente' && <FilaDientes filas={ARCADAS.temporal.inferior} {...propsFila} />}
          {denticion !== 'temporal' && <FilaDientes filas={ARCADAS.permanente.inferior} {...propsFila} />}
        </div>
        <Leyenda />
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {seleccion ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-800">
                  Diente {numeroDiente(seleccion.diente, notacion)}
                  {seleccion.superficie && ` · ${nombreSuperficie(seleccion.superficie, seleccion.diente)}`}
                </h2>
                <p className="text-sm text-slate-500">{nombreDiente(seleccion.diente)}</p>
              </div>
              {registrosDe(seleccion.diente).length > 0 && (
                <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200">
                  {registrosDe(seleccion.diente).map((r) => (
                    <li key={r.id} className="flex items-center justify-between gap-2 px-3 py-2 text-sm">
                      <span>
                        <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORES_ESTADO[r.estado] }} />
                        {describir(r)}
                      </span>
                      <button onClick={() => setAnulando(r)} className="text-xs font-semibold text-red-600 hover:underline">Anular</button>
                    </li>
                  ))}
                </ul>
              )}
              <FormularioRegistro
                key={`${seleccion.diente}-${seleccion.superficie}`}
                pacienteId={paciente.id}
                seleccion={seleccion}
                catalogo={catalogo}
                onGuardado={recargar}
              />
            </div>
          ) : (
            <p className="py-10 text-center text-sm text-slate-400">
              Haga clic en una superficie del diente o en su número para registrar un hallazgo
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="mb-4 text-lg font-semibold text-slate-800">Historial</h2>
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500">
                <tr>
                  <th className="pb-2">Fecha</th>
                  <th className="pb-2">Diente</th>
                  <th className="pb-2">Registro</th>
                  <th className="pb-2">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {registros.map((r) => (
                  <tr key={r.id} className={r.anulado ? 'text-slate-400' : 'text-slate-700'}>
                    <td className="py-2 pr-2 whitespace-nowrap">{r.fecha}</td>
                    <td className="py-2 pr-2 font-semibold">{numeroDiente(r.diente, notacion)}</td>
                    <td className="py-2 pr-2">
                      <span className={r.anulado ? 'line-through' : ''}>{describir(r)}</span>
                      {r.notas && <p className="text-xs text-slate-500">{r.notas}</p>}
                      {r.anulado && <p className="text-xs text-red-500">Anulado el {r.anulado_en}: {r.motivo_anulacion}</p>}
                    </td>
                    <td className="py-2 font-semibold" style={{ color: r.anulado ? undefined : COLORES_ESTADO[r.estado] }}>
                      {r.anulado ? 'Anulado' : r.estado === 'Requerido' ? 'Por realizar' : 'Existente'}
                    </td>
                  </tr>
                ))}
                {registros.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-slate-400">Sin registros todavía</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {anulando && (
        <ModalAnular
          registro={anulando}
          onClose={() => setAnulando(null)}
          onAnulado={() => {
            setAnulando(null)
            recargar()
          }}
        />
      )}
    </div>
  )
}
