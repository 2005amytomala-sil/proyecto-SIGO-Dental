import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { obtenerPaciente } from '../../services/pacientesService'
import AlertasMedicas from '../../components/pacientes/AlertasMedicas'

const SEXOS = { F: 'Femenino', M: 'Masculino', Otro: 'Otro' }

function Dato({ etiqueta, valor }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400">{etiqueta}</dt>
      <dd className="mt-1 whitespace-pre-line text-sm text-slate-800">{valor || '—'}</dd>
    </div>
  )
}

function Tarjeta({ titulo, children }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="text-lg font-bold text-slate-800">{titulo}</h2>
      <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</dl>
    </section>
  )
}

export default function PacienteDetalle() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    obtenerPaciente(id)
      .then(setPaciente)
      .catch((err) => setError(err.message))
  }, [id])

  if (error) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link to="/pacientes" className="text-sm font-semibold text-teal-700">
          ← Volver a pacientes
        </Link>
      </div>
    )
  }

  if (!paciente) return <p className="text-sm text-slate-500">Cargando expediente...</p>

  const { anamnesis = {} } = paciente

  return (
    <div className="space-y-6">
      <header className="space-y-4">
        <Link to="/pacientes" className="text-sm font-semibold text-slate-600 hover:text-slate-800">
          ← Volver a pacientes
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-xl font-bold text-teal-700">
              {paciente.nombres[0]}
              {paciente.apellidos[0]}
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-slate-800">
                {paciente.nombres} {paciente.apellidos}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                C.I. {paciente.cedula} · {paciente.edad} años · {SEXOS[paciente.sexo]}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to={`/pacientes/${paciente.id}/odontograma`}
              className="rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
            >
              Odontograma
            </Link>
            <Link
              to={`/pacientes/${paciente.id}/periodontograma`}
              className="rounded-xl border border-teal-200 bg-white px-5 py-3 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-teal-50"
            >
              Periodontograma
            </Link>
            <Link
              to={`/pacientes/${paciente.id}/editar`}
              className="rounded-xl bg-teal-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
            >
              Editar ficha
            </Link>
          </div>
        </div>

        <AlertasMedicas alertas={paciente.alertas} />
      </header>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <Tarjeta titulo="Datos de contacto">
          <Dato etiqueta="Teléfono" valor={paciente.telefono} />
          <Dato etiqueta="Correo electrónico" valor={paciente.email} />
          <Dato etiqueta="Dirección" valor={paciente.direccion} />
          <Dato etiqueta="Fecha de nacimiento" valor={paciente.fecha_nacimiento} />
        </Tarjeta>

        <Tarjeta titulo="Contacto de emergencia">
          <Dato etiqueta="Nombre" valor={paciente.contacto_emergencia_nombre} />
          <Dato etiqueta="Teléfono" valor={paciente.contacto_emergencia_telefono} />
          <Dato etiqueta="Parentesco" valor={paciente.contacto_emergencia_parentesco} />
        </Tarjeta>

        {paciente.tutor_nombre && (
          <Tarjeta titulo="Tutor legal">
            <Dato etiqueta="Nombre" valor={paciente.tutor_nombre} />
            <Dato etiqueta="Cédula" valor={paciente.tutor_cedula} />
            <Dato etiqueta="Teléfono" valor={paciente.tutor_telefono} />
            <Dato etiqueta="Parentesco" valor={paciente.tutor_parentesco} />
          </Tarjeta>
        )}

        <Tarjeta titulo="Seguro dental / Convenio">
          <Dato etiqueta="Aseguradora o convenio" valor={paciente.seguro_nombre} />
          <Dato etiqueta="Número de póliza" valor={paciente.seguro_numero_poliza} />
        </Tarjeta>
      </div>

      <Tarjeta titulo="Anamnesis">
        <Dato etiqueta="Enfermedades sistémicas" valor={anamnesis.enfermedades_sistemicas} />
        <Dato etiqueta="Alergias a fármacos" valor={anamnesis.alergias_farmacos} />
        <Dato etiqueta="Antecedentes quirúrgicos" valor={anamnesis.antecedentes_quirurgicos} />
        <Dato etiqueta="Medicamentos actuales" valor={anamnesis.medicamentos_actuales} />
        <Dato etiqueta="Coagulopatía" valor={anamnesis.coagulopatia ? 'Sí' : 'No'} />
        <Dato etiqueta="Anticoagulado" valor={anamnesis.anticoagulado ? 'Sí' : 'No'} />
        <div className="sm:col-span-2">
          <Dato etiqueta="Observaciones" valor={anamnesis.observaciones} />
        </div>
      </Tarjeta>
    </div>
  )
}
