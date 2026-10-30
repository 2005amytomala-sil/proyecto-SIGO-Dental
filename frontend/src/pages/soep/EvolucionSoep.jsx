import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AlertasMedicas from '../../components/pacientes/AlertasMedicas'
import { obtenerPaciente } from '../../services/pacientesService'
import { crearAdendaSoep, crearNotaSoep, obtenerNotasSoep } from '../../services/soepService'

const campos = [
  ['subjetivo', 'Subjetivo', 'Síntomas y percepción del paciente'],
  ['objetivo', 'Objetivo', 'Hallazgos clínicos y resultados observables'],
  ['evaluacion', 'Evaluación', 'Impresión diagnóstica o evolución'],
  ['plan', 'Plan', 'Tratamiento, indicaciones y próximos pasos'],
]
const claseInput = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

function Firma({ profesional, setProfesional, firmada, setFirmada }) {
  return (
    <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end">
      <label className="text-xs font-semibold text-slate-500">Profesional responsable
        <input value={profesional} onChange={(e) => setProfesional(e.target.value)} placeholder="Nombre completo" className={`${claseInput} mt-1`} />
      </label>
      <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-semibold text-slate-600">
        <input type="checkbox" checked={firmada} onChange={(e) => setFirmada(e.target.checked)} className="h-4 w-4 accent-teal-600" />
        Confirmo firma digital
      </label>
    </div>
  )
}

function FormularioNota({ pacienteId, onGuardada }) {
  const inicial = Object.fromEntries(campos.map(([campo]) => [campo, '']))
  const [valores, setValores] = useState(inicial)
  const [profesional, setProfesional] = useState('')
  const [firmada, setFirmada] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (event) => {
    event.preventDefault()
    if (!firmada) return setError('Debe confirmar la firma digital para guardar la nota')
    setGuardando(true)
    setError('')
    try {
      await crearNotaSoep(pacienteId, { ...valores, profesional, firma: profesional })
      setValores(inicial)
      setProfesional('')
      setFirmada(false)
      onGuardada()
    } catch (err) {
      setError(Object.values(err.errores ?? {})[0] ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  return (
    <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-5">
      <div><h2 className="text-lg font-semibold text-slate-800">Nueva nota de evolución</h2><p className="text-xs text-slate-500">La nota quedará inmutable después de guardarse.</p></div>
      <div className="grid gap-4 md:grid-cols-2">
        {campos.map(([campo, titulo, ayuda]) => <label key={campo} className="text-xs font-semibold text-slate-600">{titulo}<span className="ml-1 font-normal text-slate-400">· {ayuda}</span><textarea required value={valores[campo]} onChange={(e) => setValores((actual) => ({ ...actual, [campo]: e.target.value }))} rows={4} className={`${claseInput} mt-1`} /></label>)}
      </div>
      <Firma profesional={profesional} setProfesional={setProfesional} firmada={firmada} setFirmada={setFirmada} />
      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={guardando} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{guardando ? 'Guardando…' : 'Firmar y guardar nota'}</button>
    </form>
  )
}

function FormularioAdenda({ notaId, onGuardada }) {
  const [contenido, setContenido] = useState('')
  const [profesional, setProfesional] = useState('')
  const [firmada, setFirmada] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)

  const guardar = async (event) => {
    event.preventDefault()
    if (!firmada) return setError('Debe confirmar la firma digital para guardar la adenda')
    setGuardando(true)
    setError('')
    try {
      await crearAdendaSoep(notaId, { contenido, profesional, firma: profesional })
      onGuardada()
    } catch (err) {
      setError(Object.values(err.errores ?? {})[0] ?? err.message)
    } finally {
      setGuardando(false)
    }
  }

  return <form onSubmit={guardar} className="mt-3 space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-3"><textarea required value={contenido} onChange={(e) => setContenido(e.target.value)} rows={3} placeholder="Describa la corrección o aclaración" className={claseInput} /><Firma profesional={profesional} setProfesional={setProfesional} firmada={firmada} setFirmada={setFirmada} />{error && <p className="text-sm text-red-700">{error}</p>}<button type="submit" disabled={guardando} className="rounded-lg bg-amber-600 px-4 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-50">{guardando ? 'Guardando…' : 'Firmar adenda'}</button></form>
}

function Nota({ nota, horasBloqueo, onActualizada }) {
  const [mostrarAdenda, setMostrarAdenda] = useState(false)
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <header className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 pb-3">
        <div><h2 className="font-semibold text-slate-800">Nota SOEP · {nota.fecha}</h2><p className="text-xs text-slate-500">Firmada por {nota.profesional} · {nota.firmado_en}</p></div>
        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${nota.bloqueada ? 'bg-slate-100 text-slate-600' : 'bg-emerald-100 text-emerald-700'}`}>{nota.bloqueada ? 'Bloqueada' : `Dentro de ${horasBloqueo} h`}</span>
      </header>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {campos.map(([campo, titulo]) => <div key={campo}><h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">{titulo}</h3><p className="mt-1 whitespace-pre-line text-sm text-slate-700">{nota[campo]}</p></div>)}
      </div>
      <div className="mt-4 border-t border-slate-100 pt-3"><p className="text-xs text-slate-500">Las notas no se editan ni eliminan. Las correcciones se documentan mediante una adenda firmada.</p><button type="button" onClick={() => setMostrarAdenda((visible) => !visible)} className="mt-2 text-xs font-semibold text-amber-700 hover:underline">{mostrarAdenda ? 'Cancelar adenda' : 'Agregar adenda'}</button>{mostrarAdenda && <FormularioAdenda notaId={nota.id} onGuardada={() => { setMostrarAdenda(false); onActualizada() }} />}{nota.adendas.length > 0 && <div className="mt-3 space-y-2">{nota.adendas.map((adenda) => <div key={adenda.id} className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-slate-700"><p>{adenda.contenido}</p><p className="mt-1 text-slate-500">Adenda firmada por {adenda.profesional} · {adenda.fecha}</p></div>)}</div>}</div>
    </article>
  )
}

export default function EvolucionSoep() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [datos, setDatos] = useState({ horas_bloqueo: 24, notas: [] })
  const [error, setError] = useState('')
  const cargar = () => obtenerNotasSoep(id).then(setDatos).catch((err) => setError(err.message))

  useEffect(() => {
    Promise.all([obtenerPaciente(id), obtenerNotasSoep(id)])
      .then(([datosPaciente, notas]) => { setPaciente(datosPaciente); setDatos(notas) })
      .catch((err) => setError(err.message))
  }, [id])

  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!paciente) return <p className="text-sm text-slate-500">Cargando…</p>
  return <div className="space-y-6"><header className="space-y-3"><Link to={`/pacientes/${paciente.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Ficha del paciente</Link><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-800">Evolución SOEP · {paciente.nombres} {paciente.apellidos}</h1><p className="text-sm text-slate-500">Bitácora clínica inmutable · bloqueo configurable: {datos.horas_bloqueo} horas</p></div><Link to={`/pacientes/${paciente.id}/odontograma`} className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Odontograma</Link></div><AlertasMedicas alertas={paciente.alertas} /></header><FormularioNota pacienteId={paciente.id} onGuardada={cargar} /><section className="space-y-4"><div><h2 className="text-xl font-bold text-slate-800">Historial de evolución</h2><p className="text-sm text-slate-500">{datos.notas.length} nota(s) registrada(s)</p></div>{datos.notas.map((nota) => <Nota key={nota.id} nota={nota} horasBloqueo={datos.horas_bloqueo} onActualizada={cargar} />)}{datos.notas.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Todavía no hay notas de evolución.</div>}</section></div>
}
