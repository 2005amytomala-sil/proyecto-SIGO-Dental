const CAMPOS = ['subjetivo', 'objetivo', 'evaluacion', 'plan']

const texto = (valor) => String(valor ?? '').trim()

export function validarNota(body = {}) {
  const errores = {}
  const nota = {}
  for (const campo of CAMPOS) {
    nota[campo] = texto(body[campo])
    if (!nota[campo]) errores[campo] = `Complete el campo ${campo}`
  }
  nota.profesional = texto(body.profesional)
  nota.firma = texto(body.firma)
  if (!nota.profesional) errores.profesional = 'Indique el profesional responsable'
  if (!nota.firma) errores.firma = 'Confirme la firma digital del profesional'
  return { errores, nota }
}

export function validarAdenda(body = {}) {
  const errores = {}
  const adenda = {
    contenido: texto(body.contenido),
    profesional: texto(body.profesional),
    firma: texto(body.firma),
  }
  if (!adenda.contenido) errores.contenido = 'Describa la corrección o aclaración'
  if (!adenda.profesional) errores.profesional = 'Indique el profesional responsable'
  if (!adenda.firma) errores.firma = 'Confirme la firma digital del profesional'
  return { errores, adenda }
}
