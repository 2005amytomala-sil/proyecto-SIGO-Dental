const pad = (n) => String(n).padStart(2, '0')

export const aISO = (fecha) => `${fecha.getFullYear()}-${pad(fecha.getMonth() + 1)}-${pad(fecha.getDate())}`

export const desdeISO = (iso) => new Date(`${iso}T00:00:00`)

export const hoyISO = () => aISO(new Date())

export function sumarDias(iso, dias) {
  const fecha = desdeISO(iso)
  fecha.setDate(fecha.getDate() + dias)
  return aISO(fecha)
}

export function inicioSemana(iso) {
  const desplazamiento = (desdeISO(iso).getDay() + 6) % 7
  return sumarDias(iso, -desplazamiento)
}

export const minutosDesdeHora = (hora) => {
  const [h, m] = hora.split(':').map(Number)
  return h * 60 + m
}

export const horaDesdeMinutos = (minutos) => `${pad(Math.floor(minutos / 60))}:${pad(minutos % 60)}`

export const formatearFechaLarga = (iso) =>
  desdeISO(iso).toLocaleDateString('es-EC', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const formatearFechaCorta = (iso) =>
  desdeISO(iso).toLocaleDateString('es-EC', { day: 'numeric', month: 'short', year: 'numeric' })

export const formatearDiaSemana = (iso) =>
  desdeISO(iso).toLocaleDateString('es-EC', { weekday: 'short', day: 'numeric' })
