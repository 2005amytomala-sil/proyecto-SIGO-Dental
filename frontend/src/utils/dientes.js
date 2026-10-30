// Notación FDI: cuadrante (1-4 permanentes, 5-8 temporales) + posición desde la línea media
export const ARCADAS = {
  permanente: {
    superior: [[18, 17, 16, 15, 14, 13, 12, 11], [21, 22, 23, 24, 25, 26, 27, 28]],
    inferior: [[48, 47, 46, 45, 44, 43, 42, 41], [31, 32, 33, 34, 35, 36, 37, 38]],
  },
  temporal: {
    superior: [[55, 54, 53, 52, 51], [61, 62, 63, 64, 65]],
    inferior: [[85, 84, 83, 82, 81], [71, 72, 73, 74, 75]],
  },
}

const cuadrante = (diente) => Math.floor(diente / 10)
const posicion = (diente) => diente % 10

export const esSuperior = (diente) => [1, 2, 5, 6].includes(cuadrante(diente))
export const esTemporal = (diente) => cuadrante(diente) >= 5
// En el lado derecho del paciente (izquierda de la pantalla) la cara mesial queda hacia la derecha
export const mesialALaDerecha = (diente) => [1, 4, 5, 8].includes(cuadrante(diente))

const UNIVERSAL_TEMPORAL = 'ABCDEFGHIJKLMNOPQRST'

export function numeroUniversal(diente) {
  const c = cuadrante(diente)
  const p = posicion(diente)
  if (c === 1) return String(9 - p)
  if (c === 2) return String(8 + p)
  if (c === 3) return String(25 - p)
  if (c === 4) return String(24 + p)
  if (c === 5) return UNIVERSAL_TEMPORAL[5 - p]
  if (c === 6) return UNIVERSAL_TEMPORAL[4 + p]
  if (c === 7) return UNIVERSAL_TEMPORAL[15 - p]
  return UNIVERSAL_TEMPORAL[14 + p]
}

export const numeroDiente = (diente, notacion) => (notacion === 'universal' ? numeroUniversal(diente) : String(diente))

export function nombreDiente(diente) {
  const p = posicion(diente)
  const lado = [1, 4, 5, 8].includes(cuadrante(diente)) ? 'derecho' : 'izquierdo'
  const arcada = esSuperior(diente) ? 'superior' : 'inferior'
  let tipo
  if (esTemporal(diente)) tipo = ['Incisivo central', 'Incisivo lateral', 'Canino', 'Primer molar', 'Segundo molar'][p - 1]
  else tipo = ['Incisivo central', 'Incisivo lateral', 'Canino', 'Primer premolar', 'Segundo premolar', 'Primer molar', 'Segundo molar', 'Tercer molar'][p - 1]
  return `${tipo} ${arcada} ${lado}${esTemporal(diente) ? ' (temporal)' : ''}`
}

export function nombreSuperficie(superficie, diente) {
  if (superficie === 'O') return posicion(diente) <= 3 ? 'Incisal' : 'Oclusal'
  if (superficie === 'L') return esSuperior(diente) ? 'Palatino' : 'Lingual'
  return { M: 'Mesial', D: 'Distal', V: 'Vestibular' }[superficie]
}

export const COLORES_ESTADO = { Requerido: '#ef4444', Existente: '#2563eb' }
export const COLOR_SELLANTE = '#16a34a'
export const ABREVIATURAS = {
  endodoncia: 'EN',
  corona: 'CO',
  protesis_removible: 'PR',
  implante: 'IM',
  exodoncia: 'EX',
  ausente: 'AU',
}

export function denticionPorEdad(edad) {
  if (edad < 6) return 'temporal'
  if (edad <= 12) return 'mixta'
  return 'permanente'
}
