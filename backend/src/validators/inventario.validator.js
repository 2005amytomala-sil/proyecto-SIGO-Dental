const texto = (valor) => String(valor ?? '').trim()

export function validarInsumo(body = {}) {
  const errores = {}
  const insumo = {
    codigo: texto(body.codigo).toUpperCase(),
    nombre: texto(body.nombre),
    unidad: texto(body.unidad),
    stock_minimo: Number(body.stock_minimo ?? 0),
  }
  if (!insumo.codigo) errores.codigo = 'Indique el código del insumo'
  if (!insumo.nombre) errores.nombre = 'Indique el nombre del insumo'
  if (!insumo.unidad) errores.unidad = 'Indique la unidad de medida'
  if (!Number.isFinite(insumo.stock_minimo) || insumo.stock_minimo < 0) errores.stock_minimo = 'Stock mínimo inválido'
  return { errores, insumo }
}

export function validarEntrada(body = {}) {
  const errores = {}
  const entrada = { cantidad: Number(body.cantidad), referencia: texto(body.referencia) || null }
  if (!Number.isFinite(entrada.cantidad) || entrada.cantidad <= 0) errores.cantidad = 'La cantidad debe ser mayor que cero'
  return { errores, entrada }
}

export function validarConsumo(body = {}) {
  const errores = {}
  const consumo = { tratamiento_id: Number(body.tratamiento_id), unidades: Number(body.unidades ?? 1), referencia: texto(body.referencia) || null }
  if (!Number.isInteger(consumo.tratamiento_id) || consumo.tratamiento_id <= 0) errores.tratamiento_id = 'Seleccione un tratamiento'
  if (!Number.isInteger(consumo.unidades) || consumo.unidades <= 0) errores.unidades = 'Las unidades deben ser un entero mayor que cero'
  return { errores, consumo }
}

export function validarConfiguracion(body = {}) {
  const errores = {}
  const items = Array.isArray(body.items) ? body.items.map((item) => ({ insumo_id: Number(item.insumo_id), cantidad: Number(item.cantidad) })) : []
  if (items.length === 0) errores.items = 'Agregue al menos un insumo'
  if (items.some((item) => !Number.isInteger(item.insumo_id) || item.insumo_id <= 0 || !Number.isFinite(item.cantidad) || item.cantidad <= 0)) errores.items = 'La configuración contiene cantidades inválidas'
  return { errores, items }
}
