const DIENTES_PERMANENTES = new Set(
  [1, 2, 3, 4].flatMap((cuadrante) => [1, 2, 3, 4, 5, 6, 7, 8].map((pieza) => cuadrante * 10 + pieza)),
)

export const PUNTOS = ['MV', 'V', 'DV', 'ML', 'L', 'DL']
export const FURCAS = ['N', 'I', 'II', 'III']
export const MOVILIDADES = ['0', 'I', 'II', 'III']

const numero = (valor) => {
  if (valor === '' || valor === null || valor === undefined) return null
  const numeroValor = Number(valor)
  return Number.isInteger(numeroValor) && numeroValor >= -20 && numeroValor <= 20 ? numeroValor : NaN
}

export function validarRegistro(body = {}) {
  const errores = {}
  const diente = Number(body.diente)
  const puntos = {}

  if (!DIENTES_PERMANENTES.has(diente)) errores.diente = 'Seleccione un diente permanente válido'
  if (!body.puntos || typeof body.puntos !== 'object') {
    errores.puntos = 'Registre los seis puntos periodontales'
  } else {
    for (const punto of PUNTOS) {
      const entrada = body.puntos[punto] ?? {}
      const profundidad = numero(entrada.profundidad)
      const margen = numero(entrada.margen)
      if (profundidad === null || Number.isNaN(profundidad) || profundidad < 0 || profundidad > 20) {
        errores[`profundidad_${punto}`] = `Profundidad inválida en ${punto}`
      }
      if (margen === null || Number.isNaN(margen)) errores[`margen_${punto}`] = `Margen inválido en ${punto}`
      if (entrada.sangrado !== undefined && typeof entrada.sangrado !== 'boolean') {
        errores[`sangrado_${punto}`] = `Sangrado inválido en ${punto}`
      }
      puntos[punto] = {
        profundidad,
        margen,
        nic: profundidad === null || margen === null ? null : profundidad + margen,
        sangrado: entrada.sangrado === true,
      }
    }
  }

  if (body.furca !== undefined && !FURCAS.includes(body.furca)) errores.furca = 'Grado de furca inválido'
  if (body.movilidad !== undefined && !MOVILIDADES.includes(body.movilidad)) errores.movilidad = 'Grado de movilidad inválido'
  const furca = FURCAS.includes(body.furca) ? body.furca : 'N'
  const movilidad = MOVILIDADES.includes(body.movilidad) ? body.movilidad : '0'
  const notas = String(body.notas ?? '').trim() || null

  return { errores, registro: { diente, puntos, furca, movilidad, notas } }
}
