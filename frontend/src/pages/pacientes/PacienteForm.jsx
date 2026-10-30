import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { actualizarPaciente, crearPaciente, obtenerPaciente } from '../../services/pacientesService'

const PACIENTE_VACIO = {
  cedula: '',
  nombres: '',
  apellidos: '',
  fecha_nacimiento: '',
  sexo: '',
  telefono: '',
  email: '',
  direccion: '',
  contacto_emergencia_nombre: '',
  contacto_emergencia_telefono: '',
  contacto_emergencia_parentesco: '',
  tutor_nombre: '',
  tutor_cedula: '',
  tutor_telefono: '',
  tutor_parentesco: '',
  seguro_nombre: '',
  seguro_numero_poliza: '',
  anamnesis: {
    enfermedades_sistemicas: '',
    alergias_farmacos: '',
    antecedentes_quirurgicos: '',
    medicamentos_actuales: '',
    coagulopatia: false,
    anticoagulado: false,
    observaciones: '',
  },
}

const aFormulario = (paciente) => {
  const formulario = { ...PACIENTE_VACIO, anamnesis: { ...PACIENTE_VACIO.anamnesis } }
  for (const campo of Object.keys(PACIENTE_VACIO)) {
    if (campo !== 'anamnesis') formulario[campo] = paciente[campo] ?? ''
  }
  for (const campo of Object.keys(PACIENTE_VACIO.anamnesis)) {
    formulario.anamnesis[campo] = paciente.anamnesis?.[campo] ?? PACIENTE_VACIO.anamnesis[campo]
  }
  return formulario
}

const esMenorDeEdad = (fecha) => {
  if (!fecha) return false
  const nacimiento = new Date(`${fecha}T00:00:00`)
  const mayoria = new Date(nacimiento.getFullYear() + 18, nacimiento.getMonth(), nacimiento.getDate())
  return mayoria > new Date()
}

const claseInput =
  'w-full rounded-xl border bg-white px-4 py-2.5 text-sm text-slate-700 outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100'

function Campo({ etiqueta, error, requerido, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-slate-700">
        {etiqueta} {requerido && <span className="text-red-500">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </label>
  )
}

function Seccion({ titulo, descripcion, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
      {descripcion && <p className="mt-1 text-sm text-slate-500">{descripcion}</p>}
      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </section>
  )
}

export default function PacienteForm() {
  const { id } = useParams()
  const esEdicion = Boolean(id)
  const navigate = useNavigate()

  const [formulario, setFormulario] = useState(PACIENTE_VACIO)
  const [errores, setErrores] = useState({})
  const [mensaje, setMensaje] = useState('')
  const [cargando, setCargando] = useState(esEdicion)
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    if (!esEdicion) return
    obtenerPaciente(id)
      .then((paciente) => setFormulario(aFormulario(paciente)))
      .catch((err) => setMensaje(err.message))
      .finally(() => setCargando(false))
  }, [id, esEdicion])

  const menor = esMenorDeEdad(formulario.fecha_nacimiento)

  const cambiar = (e) => setFormulario((f) => ({ ...f, [e.target.name]: e.target.value }))
  const cambiarAnamnesis = (e) => {
    const { name, value, type, checked } = e.target
    setFormulario((f) => ({ ...f, anamnesis: { ...f.anamnesis, [name]: type === 'checkbox' ? checked : value } }))
  }

  const input = (name, props = {}) => (
    <input
      name={name}
      value={formulario[name]}
      onChange={cambiar}
      className={`${claseInput} ${errores[name] ? 'border-red-400' : 'border-slate-200'}`}
      {...props}
    />
  )

  const textarea = (name, placeholder) => (
    <textarea
      name={name}
      rows={2}
      value={formulario.anamnesis[name]}
      onChange={cambiarAnamnesis}
      placeholder={placeholder}
      className={`${claseInput} border-slate-200`}
    />
  )

  const guardar = async (e) => {
    e.preventDefault()
    setGuardando(true)
    setErrores({})
    setMensaje('')
    try {
      const guardado = esEdicion ? await actualizarPaciente(id, formulario) : await crearPaciente(formulario)
      navigate(`/pacientes/${guardado.id}`)
    } catch (err) {
      setErrores(err.errores ?? {})
      setMensaje(err.message)
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <p className="text-sm text-slate-500">Cargando paciente...</p>

  return (
    <form onSubmit={guardar} noValidate className="space-y-6">
      <section className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            {esEdicion ? 'Editar paciente' : 'Nuevo paciente'}
          </h1>
          <p className="mt-2 text-sm text-slate-500">Los campos marcados con * son obligatorios.</p>
        </div>
        <Link to={esEdicion ? `/pacientes/${id}` : '/pacientes'} className="text-sm font-semibold text-slate-600 hover:text-slate-800">
          ← Volver
        </Link>
      </section>

      {mensaje && (
        <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {mensaje}
        </p>
      )}

      <Seccion titulo="Datos personales">
        <Campo etiqueta="Cédula / Identificación" requerido error={errores.cedula}>
          {input('cedula')}
        </Campo>
        <Campo etiqueta="Fecha de nacimiento" requerido error={errores.fecha_nacimiento}>
          {input('fecha_nacimiento', { type: 'date' })}
        </Campo>
        <Campo etiqueta="Nombres" requerido error={errores.nombres}>
          {input('nombres')}
        </Campo>
        <Campo etiqueta="Apellidos" requerido error={errores.apellidos}>
          {input('apellidos')}
        </Campo>
        <Campo etiqueta="Sexo" requerido error={errores.sexo}>
          <select
            name="sexo"
            value={formulario.sexo}
            onChange={cambiar}
            className={`${claseInput} ${errores.sexo ? 'border-red-400' : 'border-slate-200'}`}
          >
            <option value="">Seleccione...</option>
            <option value="F">Femenino</option>
            <option value="M">Masculino</option>
            <option value="Otro">Otro</option>
          </select>
        </Campo>
      </Seccion>

      <Seccion titulo="Contacto">
        <Campo etiqueta="Teléfono" requerido error={errores.telefono}>
          {input('telefono', { type: 'tel' })}
        </Campo>
        <Campo etiqueta="Correo electrónico" error={errores.email}>
          {input('email', { type: 'email' })}
        </Campo>
        <div className="md:col-span-2">
          <Campo etiqueta="Dirección" error={errores.direccion}>
            {input('direccion')}
          </Campo>
        </div>
      </Seccion>

      <Seccion titulo="Contacto de emergencia">
        <Campo etiqueta="Nombre" requerido error={errores.contacto_emergencia_nombre}>
          {input('contacto_emergencia_nombre')}
        </Campo>
        <Campo etiqueta="Teléfono" requerido error={errores.contacto_emergencia_telefono}>
          {input('contacto_emergencia_telefono', { type: 'tel' })}
        </Campo>
        <Campo etiqueta="Parentesco" error={errores.contacto_emergencia_parentesco}>
          {input('contacto_emergencia_parentesco')}
        </Campo>
      </Seccion>

      {menor && (
        <Seccion titulo="Tutor legal" descripcion="Obligatorio porque el paciente es menor de edad.">
          <Campo etiqueta="Nombre del tutor" requerido error={errores.tutor_nombre}>
            {input('tutor_nombre')}
          </Campo>
          <Campo etiqueta="Cédula del tutor" error={errores.tutor_cedula}>
            {input('tutor_cedula')}
          </Campo>
          <Campo etiqueta="Teléfono del tutor" requerido error={errores.tutor_telefono}>
            {input('tutor_telefono', { type: 'tel' })}
          </Campo>
          <Campo etiqueta="Parentesco" error={errores.tutor_parentesco}>
            {input('tutor_parentesco')}
          </Campo>
        </Seccion>
      )}

      <Seccion titulo="Seguro dental / Convenio">
        <Campo etiqueta="Aseguradora o convenio" error={errores.seguro_nombre}>
          {input('seguro_nombre')}
        </Campo>
        <Campo etiqueta="Número de póliza" error={errores.seguro_numero_poliza}>
          {input('seguro_numero_poliza')}
        </Campo>
      </Seccion>

      <Seccion
        titulo="Anamnesis (historial médico)"
        descripcion="Registro obligatorio. Deje en blanco los campos sin antecedentes. Las alergias, coagulopatías y anticoagulación generan una alerta visible en el expediente."
      >
        <Campo etiqueta="Enfermedades sistémicas">
          {textarea('enfermedades_sistemicas', 'Ej.: diabetes, hipertensión...')}
        </Campo>
        <Campo etiqueta="Alergias a fármacos">
          {textarea('alergias_farmacos', 'Ej.: penicilina, látex...')}
        </Campo>
        <Campo etiqueta="Antecedentes quirúrgicos">
          {textarea('antecedentes_quirurgicos', 'Cirugías previas')}
        </Campo>
        <Campo etiqueta="Medicamentos actuales">
          {textarea('medicamentos_actuales', 'Medicación habitual')}
        </Campo>
        <div className="flex flex-col gap-3 md:col-span-2 md:flex-row md:gap-8">
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="coagulopatia"
              checked={formulario.anamnesis.coagulopatia}
              onChange={cambiarAnamnesis}
              className="h-4 w-4 accent-red-600"
            />
            Presenta coagulopatía
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              name="anticoagulado"
              checked={formulario.anamnesis.anticoagulado}
              onChange={cambiarAnamnesis}
              className="h-4 w-4 accent-red-600"
            />
            Paciente anticoagulado
          </label>
        </div>
        <div className="md:col-span-2">
          <Campo etiqueta="Observaciones">{textarea('observaciones', 'Otras observaciones médicas')}</Campo>
        </div>
      </Seccion>

      <div className="flex justify-end gap-3">
        <Link
          to={esEdicion ? `/pacientes/${id}` : '/pacientes'}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={guardando}
          className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:opacity-60"
        >
          {guardando ? 'Guardando...' : 'Guardar paciente'}
        </button>
      </div>
    </form>
  )
}
