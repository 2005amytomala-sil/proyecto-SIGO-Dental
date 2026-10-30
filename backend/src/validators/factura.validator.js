export const IVA_PORCENTAJE = Number(process.env.IVA_PORCENTAJE ?? 15)
export const METODOS_PAGO = ['Efectivo', 'Tarjeta de crédito', 'Tarjeta de débito', 'Transferencia', 'Seguro']

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100

const limpiarTexto = (valor) => {
  if (valor === undefined || valor === null) return null
  const texto = String(valor).trim()
  return texto === '' ? null : texto
}

export function calcularTotales(detalles, ivaPorcentaje = IVA_PORCENTAJE) {
  let subtotal0 = 0
  let subtotalIva = 0
  let descuento = 0
  const lineas = detalles.map((d) => {
    const subtotal = redondear(d.cantidad * d.precio_unitario - d.descuento)
    descuento += d.descuento
    if (d.grava_iva) subtotalIva += subtotal
    else subtotal0 += subtotal
    return { ...d, subtotal }
  })
  const iva = redondear(subtotalIva * ivaPorcentaje / 100)
  return {
    lineas,
    subtotal_0: redondear(subtotal0),
    subtotal_iva: redondear(subtotalIva),
    descuento: redondear(descuento),
    iva,
    total: redondear(subtotal0 + subtotalIva + iva),
  }
}

export function validarFactura(body = {}) {
  const errores = {}
  const factura = {
    paciente_id: Number(body.paciente_id) || null,
    cita_id: Number(body.cita_id) || null,
    cliente_nombre: limpiarTexto(body.cliente_nombre),
    cliente_identificacion: limpiarTexto(body.cliente_identificacion),
    cliente_direccion: limpiarTexto(body.cliente_direccion),
    cliente_email: limpiarTexto(body.cliente_email),
  }

  if (!factura.paciente_id) errores.paciente_id = 'Seleccione el paciente'
  if (!factura.cliente_nombre) errores.cliente_nombre = 'El nombre o razón social es obligatorio'
  if (!factura.cliente_identificacion) errores.cliente_identificacion = 'La cédula o RUC es obligatorio'
  if (factura.cliente_email && !EMAIL_REGEX.test(factura.cliente_email)) errores.cliente_email = 'Correo electrónico inválido'

  const detalles = (Array.isArray(body.detalles) ? body.detalles : []).map((d) => ({
    tratamiento_id: Number(d.tratamiento_id) || null,
    descripcion: limpiarTexto(d.descripcion),
    cantidad: Number(d.cantidad),
    precio_unitario: redondear(Number(d.precio_unitario)),
    descuento: redondear(Number(d.descuento) || 0),
    grava_iva: d.grava_iva === true,
  }))

  if (detalles.length === 0) errores.detalles = 'Agregue al menos un tratamiento o servicio'
  detalles.forEach((d, i) => {
    if (errores.detalles) return
    const linea = `Línea ${i + 1}`
    if (!d.descripcion) errores.detalles = `${linea}: la descripción es obligatoria`
    else if (!Number.isInteger(d.cantidad) || d.cantidad < 1 || d.cantidad > 100) errores.detalles = `${linea}: cantidad inválida`
    else if (!Number.isFinite(d.precio_unitario) || d.precio_unitario < 0) errores.detalles = `${linea}: precio inválido`
    else if (d.descuento < 0 || d.descuento > d.cantidad * d.precio_unitario) {
      errores.detalles = `${linea}: el descuento no puede superar el valor de la línea`
    }
  })

  const pagos = (Array.isArray(body.pagos) ? body.pagos : []).map((p) => ({
    metodo: limpiarTexto(p.metodo),
    monto: redondear(Number(p.monto)),
    referencia: limpiarTexto(p.referencia),
  }))

  const totales = errores.detalles ? null : calcularTotales(detalles)

  if (pagos.length === 0) errores.pagos = 'Registre al menos una forma de pago'
  else if (pagos.some((p) => !METODOS_PAGO.includes(p.metodo))) errores.pagos = 'Forma de pago inválida'
  else if (pagos.some((p) => !Number.isFinite(p.monto) || p.monto <= 0)) errores.pagos = 'Cada pago debe tener un monto mayor a 0'
  else if (totales) {
    const suma = redondear(pagos.reduce((acc, p) => acc + p.monto, 0))
    if (suma !== totales.total) {
      errores.pagos = `La suma de los pagos ($${suma.toFixed(2)}) debe ser igual al total ($${totales.total.toFixed(2)})`
    }
  }

  return { errores, factura, totales, pagos }
}
