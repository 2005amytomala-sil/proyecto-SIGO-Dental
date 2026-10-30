import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import AlertasMedicas from '../../components/pacientes/AlertasMedicas'
import { crearConsentimiento, crearReceta, obtenerDocumentosClinicos } from '../../services/documentosService'
import { obtenerPaciente } from '../../services/pacientesService'

const claseInput = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-700 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100'
const vacioMedicamento = () => ({ medicamento: '', dosis: '', frecuencia: '', duracion: '', indicaciones: '' })
const PLANTILLAS = {
  'Extracción dental': 'Se me ha explicado el procedimiento de extracción dental, sus beneficios, riesgos, alternativas y cuidados posteriores. He podido realizar preguntas y las respuestas fueron claras.',
  'Endodoncia': 'Se me ha explicado el procedimiento de endodoncia, sus beneficios, riesgos, alternativas y cuidados posteriores. He podido realizar preguntas y las respuestas fueron claras.',
  'Implante dental': 'Se me ha explicado el procedimiento de implante dental, sus beneficios, riesgos, alternativas y cuidados posteriores. He podido realizar preguntas y las respuestas fueron claras.',
  'Procedimiento personalizado': '',
}

function FirmaCanvas({ value, onChange }) {
  const canvasRef = useRef(null)
  const dibujando = useRef(false)
  useEffect(() => {
    const canvas = canvasRef.current
    canvas.width = 700
    canvas.height = 220
    const contexto = canvas.getContext('2d')
    contexto.fillStyle = '#ffffff'
    contexto.fillRect(0, 0, canvas.width, canvas.height)
    contexto.strokeStyle = '#0f766e'
    contexto.lineWidth = 2
    contexto.lineCap = 'round'
  }, [])

  const punto = (evento) => {
    const rect = canvasRef.current.getBoundingClientRect()
    return { x: ((evento.clientX - rect.left) / rect.width) * 700, y: ((evento.clientY - rect.top) / rect.height) * 220 }
  }
  const iniciar = (evento) => { dibujando.current = true; canvasRef.current.setPointerCapture(evento.pointerId); const { x, y } = punto(evento); const contexto = canvasRef.current.getContext('2d'); contexto.beginPath(); contexto.moveTo(x, y) }
  const dibujar = (evento) => { if (!dibujando.current) return; const { x, y } = punto(evento); const contexto = canvasRef.current.getContext('2d'); contexto.lineTo(x, y); contexto.stroke(); onChange(canvasRef.current.toDataURL('image/png')) }
  const terminar = () => { dibujando.current = false }
  const limpiar = () => { const canvas = canvasRef.current; const contexto = canvas.getContext('2d'); contexto.clearRect(0, 0, canvas.width, canvas.height); contexto.fillStyle = '#ffffff'; contexto.fillRect(0, 0, canvas.width, canvas.height); onChange('') }

  return <div><div className="overflow-hidden rounded-xl border border-slate-200 bg-white"><canvas ref={canvasRef} onPointerDown={iniciar} onPointerMove={dibujar} onPointerUp={terminar} onPointerCancel={terminar} className="h-44 w-full touch-none" /></div><div className="mt-2 flex items-center justify-between"><span className="text-xs text-slate-400">Firme dentro del recuadro</span><button type="button" onClick={limpiar} className="text-xs font-semibold text-teal-700 hover:underline">Limpiar firma</button></div>{!value && <p className="mt-1 text-xs text-red-600">La firma es obligatoria</p>}</div>
}

function FirmaProfesional({ profesional, setProfesional, confirmado, setConfirmado }) {
  return <div className="grid gap-3 rounded-xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-end"><label className="text-xs font-semibold text-slate-500">Profesional responsable<input required value={profesional} onChange={(e) => setProfesional(e.target.value)} placeholder="Nombre completo" className={`${claseInput} mt-1`} /></label><label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-semibold text-slate-600"><input type="checkbox" checked={confirmado} onChange={(e) => setConfirmado(e.target.checked)} className="h-4 w-4 accent-teal-600" />Confirmo responsabilidad</label></div>
}

function FormularioReceta({ pacienteId, onGuardada }) {
  const [motivo, setMotivo] = useState('')
  const [indicaciones, setIndicaciones] = useState('')
  const [medicamentos, setMedicamentos] = useState([vacioMedicamento()])
  const [profesional, setProfesional] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiar = (indice, campo, valor) => setMedicamentos((actuales) => actuales.map((medicamento, i) => i === indice ? { ...medicamento, [campo]: valor } : medicamento))
  const guardar = async (event) => {
    event.preventDefault()
    if (!confirmado) return setError('Confirme la responsabilidad profesional')
    setGuardando(true); setError('')
    try {
      await crearReceta(pacienteId, { motivo, indicaciones, medicamentos, profesional, firma: profesional })
      setMotivo(''); setIndicaciones(''); setMedicamentos([vacioMedicamento()]); setProfesional(''); setConfirmado(false); onGuardada()
    } catch (err) { setError(Object.values(err.errores ?? {})[0] ?? err.message) } finally { setGuardando(false) }
  }
  return <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-teal-100 bg-teal-50/40 p-5"><div><h2 className="text-lg font-semibold text-slate-800">Nueva receta</h2><p className="text-xs text-slate-500">La receta queda firmada y no se puede editar.</p></div><label className="block text-xs font-semibold text-slate-600">Motivo / diagnóstico<input required value={motivo} onChange={(e) => setMotivo(e.target.value)} className={`${claseInput} mt-1`} /></label><div className="space-y-3"><div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-slate-700">Medicamentos</h3><button type="button" onClick={() => setMedicamentos((actuales) => [...actuales, vacioMedicamento()])} className="text-xs font-semibold text-teal-700 hover:underline">+ Agregar medicamento</button></div>{medicamentos.map((medicamento, indice) => <div key={indice} className="rounded-xl border border-slate-200 bg-white p-3"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{[['medicamento','Medicamento'],['dosis','Dosis'],['frecuencia','Frecuencia'],['duracion','Duración']].map(([campo, etiqueta]) => <input key={campo} required value={medicamento[campo]} onChange={(e) => cambiar(indice, campo, e.target.value)} placeholder={etiqueta} className={claseInput} />)}</div><div className="mt-2 flex gap-2"><input value={medicamento.indicaciones} onChange={(e) => cambiar(indice, 'indicaciones', e.target.value)} placeholder="Indicaciones específicas (opcional)" className={claseInput} />{medicamentos.length > 1 && <button type="button" onClick={() => setMedicamentos((actuales) => actuales.filter((_, i) => i !== indice))} className="px-2 text-xs font-semibold text-red-600">Quitar</button>}</div></div>)}</div><textarea value={indicaciones} onChange={(e) => setIndicaciones(e.target.value)} rows={3} placeholder="Indicaciones generales (opcional)" className={claseInput} /><FirmaProfesional profesional={profesional} setProfesional={setProfesional} confirmado={confirmado} setConfirmado={setConfirmado} />{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button type="submit" disabled={guardando} className="rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50">{guardando ? 'Guardando…' : 'Firmar y guardar receta'}</button></form>
}

function FormularioConsentimiento({ pacienteId, onGuardado }) {
  const [procedimiento, setProcedimiento] = useState('Extracción dental')
  const [contenido, setContenido] = useState(PLANTILLAS['Extracción dental'])
  const [firmante, setFirmante] = useState('')
  const [relacion, setRelacion] = useState('Paciente')
  const [profesional, setProfesional] = useState('')
  const [firmaPaciente, setFirmaPaciente] = useState('')
  const [confirmado, setConfirmado] = useState(false)
  const [error, setError] = useState('')
  const [guardando, setGuardando] = useState(false)
  const cambiarProcedimiento = (valor) => { setProcedimiento(valor); setContenido(PLANTILLAS[valor] ?? '') }
  const guardar = async (event) => {
    event.preventDefault()
    if (!confirmado) return setError('Confirme que el consentimiento fue explicado')
    if (!firmaPaciente) return setError('Capture la firma del paciente o representante')
    setGuardando(true); setError('')
    try {
      await crearConsentimiento(pacienteId, { procedimiento, contenido, firmante, relacion, firmaPaciente, profesional })
      setFirmante(''); setFirmaPaciente(''); setProfesional(''); setConfirmado(false); onGuardado()
    } catch (err) { setError(Object.values(err.errores ?? {})[0] ?? err.message) } finally { setGuardando(false) }
  }
  return <form onSubmit={guardar} className="space-y-4 rounded-2xl border border-violet-100 bg-violet-50/40 p-5"><div><h2 className="text-lg font-semibold text-slate-800">Nuevo consentimiento informado</h2><p className="text-xs text-slate-500">El documento y la firma quedan guardados en el expediente.</p></div><label className="block text-xs font-semibold text-slate-600">Procedimiento<select value={procedimiento} onChange={(e) => cambiarProcedimiento(e.target.value)} className={`${claseInput} mt-1`}>{Object.keys(PLANTILLAS).map((plantilla) => <option key={plantilla}>{plantilla}</option>)}</select></label><label className="block text-xs font-semibold text-slate-600">Texto del consentimiento<textarea required value={contenido} onChange={(e) => setContenido(e.target.value)} rows={5} className={`${claseInput} mt-1`} /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-xs font-semibold text-slate-600">Firmante<input required value={firmante} onChange={(e) => setFirmante(e.target.value)} placeholder="Paciente o representante" className={`${claseInput} mt-1`} /></label><label className="text-xs font-semibold text-slate-600">Relación<select value={relacion} onChange={(e) => setRelacion(e.target.value)} className={`${claseInput} mt-1`}><option>Paciente</option><option>Padre / madre</option><option>Tutor legal</option><option>Representante</option></select></label></div><div><p className="mb-1 text-xs font-semibold text-slate-600">Firma del paciente o representante</p><FirmaCanvas value={firmaPaciente} onChange={setFirmaPaciente} /></div><FirmaProfesional profesional={profesional} setProfesional={setProfesional} confirmado={confirmado} setConfirmado={setConfirmado} />{error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}<button type="submit" disabled={guardando} className="rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-50">{guardando ? 'Guardando…' : 'Firmar y guardar consentimiento'}</button></form>
}

function Historial({ documentos }) {
  return <section className="space-y-4"><h2 className="text-xl font-bold text-slate-800">Documentos firmados</h2>{documentos.recetas.map((receta) => <article key={`r-${receta.id}`} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-800">Receta · {receta.motivo}</h3><span className="text-xs text-slate-400">{receta.fecha}</span></div><p className="mt-1 text-xs text-slate-500">Firmada por {receta.profesional}</p><ul className="mt-3 divide-y divide-slate-100 text-sm">{receta.medicamentos.map((medicamento, indice) => <li key={indice} className="py-2"><strong>{medicamento.medicamento}</strong> · {medicamento.dosis} · {medicamento.frecuencia} · {medicamento.duracion}{medicamento.indicaciones && <p className="text-xs text-slate-500">{medicamento.indicaciones}</p>}</li>)}</ul>{receta.indicaciones && <p className="mt-2 text-sm text-slate-600">{receta.indicaciones}</p>}</article>)}{documentos.consentimientos.map((consentimiento) => <article key={`c-${consentimiento.id}`} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex flex-wrap justify-between gap-2"><h3 className="font-semibold text-slate-800">Consentimiento · {consentimiento.procedimiento}</h3><span className="text-xs text-slate-400">{consentimiento.fecha}</span></div><p className="mt-1 text-xs text-slate-500">Firmado por {consentimiento.firmante} ({consentimiento.relacion}) · Profesional: {consentimiento.profesional}</p><p className="mt-3 whitespace-pre-line text-sm text-slate-700">{consentimiento.contenido}</p></article>)}{documentos.recetas.length + documentos.consentimientos.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-400">Todavía no hay documentos firmados.</div>}</section>
}

export default function DocumentosClinicos() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [documentos, setDocumentos] = useState({ recetas: [], consentimientos: [] })
  const [pestana, setPestana] = useState('receta')
  const [error, setError] = useState('')
  const cargar = () => obtenerDocumentosClinicos(id).then(setDocumentos).catch((err) => setError(err.message))
  useEffect(() => { Promise.all([obtenerPaciente(id), obtenerDocumentosClinicos(id)]).then(([datosPaciente, datosDocumentos]) => { setPaciente(datosPaciente); setDocumentos(datosDocumentos) }).catch((err) => setError(err.message)) }, [id])
  if (error) return <p className="rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p>
  if (!paciente) return <p className="text-sm text-slate-500">Cargando…</p>
  return <div className="space-y-6"><header className="space-y-3"><Link to={`/pacientes/${paciente.id}`} className="text-sm font-semibold text-slate-500 hover:text-slate-700">← Ficha del paciente</Link><div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-bold text-slate-800">Recetas y consentimientos · {paciente.nombres} {paciente.apellidos}</h1><p className="text-sm text-slate-500">Documentos clínicos firmados e inmutables</p></div><Link to={`/pacientes/${paciente.id}/evolucion`} className="rounded-xl border border-teal-200 bg-white px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50">Evolución SOEP</Link></div><AlertasMedicas alertas={paciente.alertas} /></header><div className="flex rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => setPestana('receta')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${pestana === 'receta' ? 'bg-white text-teal-700 shadow-sm' : 'text-slate-500'}`}>Nueva receta</button><button type="button" onClick={() => setPestana('consentimiento')} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold ${pestana === 'consentimiento' ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500'}`}>Nuevo consentimiento</button></div>{pestana === 'receta' ? <FormularioReceta pacienteId={paciente.id} onGuardada={cargar} /> : <FormularioConsentimiento pacienteId={paciente.id} onGuardado={cargar} />}<Historial documentos={documentos} /></div>
}
