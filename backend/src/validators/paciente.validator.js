const SEXOS = ['F', 'M', 'Otro']
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const CAMPOS_PACIENTE = [
  'cedula', 'nombres', 'apellidos', 'fecha_nacimiento', 'sexo', 'telefono', 'email', 'direccion',
  'contacto_emergencia_nombre', 'contacto_emergencia_telefono', 'contacto_emergencia_parentesco',
  'tutor_nombre', 'tutor_cedula', 'tutor_telefono', 'tutor_parentesco',
  'seguro_nombre', 'seguro_numero_poliza',
]

const CAMPOS_ANAMNESIS_TEXTO = [
  'enfermedades_sistemicas', 'alergias_farmacos', 'antecedentes_quirurgicos',
  'medicamentos_actuales', 'observaciones',
]

const OBLIGATORIOS = {
  cedula: 'La cédula es obligatoria',
  nombres: 'Los nombres son obligatorios',
  apellidos: 'Los apellidos son obligatorios',
  fecha_nacimiento: 'La fecha de nacimiento es obligatoria',
  sexo: 'El sexo es obligatorio',
  telefono: 'El teléfono es obligatorio',
  contacto_emergencia_nombre: 'El nombre del contacto de emergencia es obligatorio',
  contacto_emergencia_telefono: 'El teléfono del contacto de emergencia es obligatorio',
}

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

export function calcularEdad(fechaNacimiento, hoy = new Date()) {
  const [anio, mes, dia] = fechaNacimiento.split('-').map(Number)
  let edad = hoy.getFullYear() - anio
  const cumpleEsteAnio = hoy.getMonth() + 1 > mes || (hoy.getMonth() + 1 === mes && hoy.getDate() >= dia)
  if (!cumpleEsteAnio) edad -= 1
  return edad
}

export function validarPaciente(body = {}) {
  const errores = {}
  const paciente = Object.fromEntries(CAMPOS_PACIENTE.map((campo) => [campo, limpiarTexto(body[campo])]))

  for (const [campo, mensaje] of Object.entries(OBLIGATORIOS)) {
    if (!paciente[campo]) errores[campo] = mensaje
  }

  if (paciente.fecha_nacimiento) {
    const fecha = new Date(`${paciente.fecha_nacimiento}T00:00:00`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(paciente.fecha_nacimiento) || Number.isNaN(fecha.getTime())) {
      errores.fecha_nacimiento = 'Fecha de nacimiento inválida (formato AAAA-MM-DD)'
    } else if (fecha > new Date()) {
      errores.fecha_nacimiento = 'La fecha de nacimiento no puede ser futura'
    } else if (calcularEdad(paciente.fecha_nacimiento) < 18) {
      if (!paciente.tutor_nombre) errores.tutor_nombre = 'El tutor legal es obligatorio para menores de edad'
      if (!paciente.tutor_telefono) errores.tutor_telefono = 'El teléfono del tutor es obligatorio para menores de edad'
    }
  }

  if (paciente.sexo && !SEXOS.includes(paciente.sexo)) errores.sexo = 'Sexo inválido'
  if (paciente.email && !EMAIL_REGEX.test(paciente.email)) errores.email = 'Correo electrónico inválido'

  let anamnesis = null
  if (!body.anamnesis || typeof body.anamnesis !== 'object') {
    errores.anamnesis = 'La anamnesis (historial médico) es obligatoria'
  } else {
    anamnesis = Object.fromEntries(CAMPOS_ANAMNESIS_TEXTO.map((campo) => [campo, limpiarTexto(body.anamnesis[campo])]))
    anamnesis.coagulopatia = body.anamnesis.coagulopatia === true
    anamnesis.anticoagulado = body.anamnesis.anticoagulado === true
  }

  return { errores, paciente, anamnesis }
}

// RF-02: condiciones críticas que se muestran como alerta en la cabecera del expediente
export function calcularAlertas(anamnesis) {
  if (!anamnesis) return []
  const alertas = []
  if (anamnesis.alergias_farmacos) alertas.push(`Alergia: ${anamnesis.alergias_farmacos}`)
  if (anamnesis.anticoagulado) alertas.push('Paciente anticoagulado')
  if (anamnesis.coagulopatia) alertas.push('Coagulopatía')
  return alertas
}
