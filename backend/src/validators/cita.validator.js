export const ESTADOS_CITA = [
  'Programado', 'Confirmado', 'En sala de espera', 'En atención', 'Atendido', 'Cancelado', 'No asistió',
]

// RF-10: transiciones permitidas entre estados del turno
export const TRANSICIONES = {
  Programado: ['Confirmado', 'En sala de espera', 'Cancelado', 'No asistió'],
  Confirmado: ['En sala de espera', 'Cancelado', 'No asistió'],
  'En sala de espera': ['En atención', 'Cancelado'],
  'En atención': ['Atendido'],
  Atendido: [],
  Cancelado: [],
  'No asistió': [],
}

export const ESTADOS_EDITABLES = ['Programado', 'Confirmado']

// Horario operativo de la clínica (RNF-02)
export const HORA_APERTURA = 7 * 60
export const HORA_CIERRE = 21 * 60

const FECHA_REGEX = /^\d{4}-\d{2}-\d{2}$/
const HORA_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/

const esIdValido = (valor) => Number.isInteger(Number(valor)) && Number(valor) > 0

export function validarCita(body = {}) {
  const errores = {}

  for (const campo of ['paciente_id', 'odontologo_id', 'sillon_id']) {
    if (!esIdValido(body[campo])) errores[campo] = 'Seleccione una opción válida'
  }

  const fecha = String(body.fecha ?? '')
  if (!FECHA_REGEX.test(fecha) || Number.isNaN(new Date(`${fecha}T00:00:00`).getTime())) {
    errores.fecha = 'Fecha inválida'
  }

  const hora = String(body.hora_inicio ?? '')
  const duracion = Number(body.duracion_min)
  const coincidencia = hora.match(HORA_REGEX)

  if (!coincidencia) {
    errores.hora_inicio = 'Hora inválida'
  }
  if (!Number.isInteger(duracion) || duracion < 15 || duracion > 240 || duracion % 15 !== 0) {
    errores.duracion_min = 'La duración debe estar entre 15 y 240 minutos, en bloques de 15'
  }
  if (coincidencia && !errores.duracion_min) {
    const inicioMin = Number(coincidencia[1]) * 60 + Number(coincidencia[2])
    if (inicioMin < HORA_APERTURA || inicioMin + duracion > HORA_CIERRE) {
      errores.hora_inicio = 'La cita debe estar dentro del horario de atención (07:00 a 21:00)'
    }
  }

  const motivo = String(body.motivo ?? '').trim()
  if (!motivo) errores.motivo = 'El motivo de la cita es obligatorio'

  const observaciones = String(body.observaciones ?? '').trim() || null

  return {
    errores,
    cita: {
      paciente_id: Number(body.paciente_id),
      odontologo_id: Number(body.odontologo_id),
      sillon_id: Number(body.sillon_id),
      inicio: `${fecha} ${hora}`,
      duracion_min: duracion,
      motivo,
      observaciones,
    },
  }
}
