export const HALLAZGOS = [
  { codigo: 'caries', nombre: 'Caries', tipo: 'superficie', estados: ['Requerido'] },
  { codigo: 'restauracion', nombre: 'Restauración', tipo: 'superficie', estados: ['Existente', 'Requerido'] },
  { codigo: 'sellante', nombre: 'Sellante', tipo: 'superficie', estados: ['Existente', 'Requerido'] },
  { codigo: 'endodoncia', nombre: 'Endodoncia', tipo: 'diente', estados: ['Existente', 'Requerido'] },
  { codigo: 'corona', nombre: 'Corona / prótesis fija', tipo: 'diente', estados: ['Existente', 'Requerido'] },
  { codigo: 'protesis_removible', nombre: 'Prótesis removible', tipo: 'diente', estados: ['Existente', 'Requerido'] },
  { codigo: 'implante', nombre: 'Implante', tipo: 'diente', estados: ['Existente', 'Requerido'] },
  { codigo: 'exodoncia', nombre: 'Exodoncia', tipo: 'diente', estados: ['Requerido', 'Existente'] },
  { codigo: 'ausente', nombre: 'Diente ausente', tipo: 'diente', estados: ['Existente'] },
]

export const SUPERFICIES = ['M', 'D', 'O', 'V', 'L']

// Notación FDI: permanentes (cuadrantes 1-4, piezas 1-8) y temporales (cuadrantes 5-8, piezas 1-5)
const PERMANENTES = [1, 2, 3, 4].flatMap((c) => [1, 2, 3, 4, 5, 6, 7, 8].map((p) => c * 10 + p))
const TEMPORALES = [5, 6, 7, 8].flatMap((c) => [1, 2, 3, 4, 5].map((p) => c * 10 + p))
export const DIENTES_FDI = new Set([...PERMANENTES, ...TEMPORALES])

export function validarRegistro(body = {}) {
  const errores = {}
  const diente = Number(body.diente)
  const hallazgo = HALLAZGOS.find((h) => h.codigo === body.hallazgo)
  const superficies = [...new Set(Array.isArray(body.superficies) ? body.superficies : [])]
  const notas = String(body.notas ?? '').trim() || null

  if (!DIENTES_FDI.has(diente)) errores.diente = 'Diente inválido (use notación FDI)'
  if (!hallazgo) errores.hallazgo = 'Seleccione un hallazgo válido'
  else {
    if (!hallazgo.estados.includes(body.estado)) errores.estado = 'Estado no permitido para este hallazgo'
    if (hallazgo.tipo === 'superficie') {
      if (superficies.length === 0) errores.superficies = 'Seleccione al menos una superficie'
      else if (superficies.some((s) => !SUPERFICIES.includes(s))) errores.superficies = 'Superficie inválida'
    }
  }

  return {
    errores,
    registro: {
      diente,
      hallazgo: hallazgo?.codigo,
      estado: body.estado,
      notas,
      superficies: hallazgo?.tipo === 'superficie' ? superficies : [null],
    },
  }
}
