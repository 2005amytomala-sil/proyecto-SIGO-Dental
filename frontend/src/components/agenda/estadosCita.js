// RF-10: estados del turno y transiciones permitidas (deben coincidir con el backend)
export const ESTADOS_CITA = {
  Programado: { clase: 'bg-slate-100 text-slate-700', accion: 'Volver a programado' },
  Confirmado: { clase: 'bg-emerald-100 text-emerald-700', accion: 'Confirmar' },
  'En sala de espera': { clase: 'bg-amber-100 text-amber-700', accion: 'Registrar llegada' },
  'En atención': { clase: 'bg-blue-100 text-blue-700', accion: 'Pasar a atención' },
  Atendido: { clase: 'bg-teal-100 text-teal-700', accion: 'Marcar como atendido' },
  Cancelado: { clase: 'bg-red-100 text-red-700', accion: 'Cancelar cita' },
  'No asistió': { clase: 'bg-zinc-200 text-zinc-700', accion: 'Marcar no asistió' },
}

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

export const ESTADOS_INACTIVOS = ['Cancelado', 'No asistió']

export const COLORES_ODONTOLOGO = {
  teal: 'border-teal-500 bg-teal-50 hover:bg-teal-100',
  blue: 'border-blue-500 bg-blue-50 hover:bg-blue-100',
  violet: 'border-violet-500 bg-violet-50 hover:bg-violet-100',
  amber: 'border-amber-500 bg-amber-50 hover:bg-amber-100',
  rose: 'border-rose-500 bg-rose-50 hover:bg-rose-100',
}

export const HORA_APERTURA = 7 * 60
export const HORA_CIERRE = 21 * 60
