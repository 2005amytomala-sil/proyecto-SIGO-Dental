const texto = (valor) => String(valor ?? '').trim()

export function validarReceta(body = {}) {
  const errores = {}
  const medicamentos = Array.isArray(body.medicamentos)
    ? body.medicamentos.map((medicamento) => ({
      medicamento: texto(medicamento.medicamento),
      dosis: texto(medicamento.dosis),
      frecuencia: texto(medicamento.frecuencia),
      duracion: texto(medicamento.duracion),
      indicaciones: texto(medicamento.indicaciones),
    })).filter((medicamento) => Object.values(medicamento).some(Boolean))
    : []
  if (!texto(body.motivo)) errores.motivo = 'Indique el motivo de la receta'
  if (medicamentos.length === 0) errores.medicamentos = 'Agregue al menos un medicamento'
  medicamentos.forEach((medicamento, indice) => {
    for (const campo of ['medicamento', 'dosis', 'frecuencia', 'duracion']) {
      if (!medicamento[campo]) errores[`medicamento_${indice}_${campo}`] = `Complete ${campo} del medicamento ${indice + 1}`
    }
  })
  if (!texto(body.profesional)) errores.profesional = 'Indique el profesional responsable'
  if (!texto(body.firma)) errores.firma = 'Confirme la firma del profesional'
  return {
    errores,
    receta: { motivo: texto(body.motivo), indicaciones: texto(body.indicaciones) || null, medicamentos, profesional: texto(body.profesional), firma: texto(body.firma) },
  }
}

export function validarConsentimiento(body = {}) {
  const errores = {}
  const consentimiento = {
    procedimiento: texto(body.procedimiento),
    contenido: texto(body.contenido),
    firmante: texto(body.firmante),
    relacion: texto(body.relacion),
    firmaPaciente: texto(body.firmaPaciente),
    profesional: texto(body.profesional),
  }
  for (const campo of ['procedimiento', 'contenido', 'firmante', 'relacion', 'firmaPaciente', 'profesional']) {
    if (!consentimiento[campo]) errores[campo] = `Complete ${campo}`
  }
  return { errores, consentimiento }
}
