export function validarComision(body = {}) {
  const errores = {}
  const comision = {
    odontologo_id: Number(body.odontologo_id),
    tratamiento_id: body.tratamiento_id ? Number(body.tratamiento_id) : null,
    tipo: body.tipo,
    valor: Number(body.valor),
    deducir_costos: body.deducir_costos === true,
    costo_deducible: Number(body.costo_deducible ?? 0),
  }
  if (!Number.isInteger(comision.odontologo_id) || comision.odontologo_id <= 0) errores.odontologo_id = 'Seleccione un odontólogo'
  if (comision.tratamiento_id !== null && (!Number.isInteger(comision.tratamiento_id) || comision.tratamiento_id <= 0)) errores.tratamiento_id = 'Tratamiento inválido'
  if (!['Porcentaje', 'Monto fijo'].includes(comision.tipo)) errores.tipo = 'Tipo de comisión inválido'
  if (!Number.isFinite(comision.valor) || comision.valor < 0 || (comision.tipo === 'Porcentaje' && comision.valor > 100)) errores.valor = 'Valor de comisión inválido'
  if (!Number.isFinite(comision.costo_deducible) || comision.costo_deducible < 0) errores.costo_deducible = 'Costo deducible inválido'
  return { errores, comision }
}
