export const redondear = (valor) => Math.round((valor + Number.EPSILON) * 100) / 100

// Mismo cálculo que el backend (validators/factura.validator.js)
export function calcularTotales(detalles, ivaPorcentaje) {
  let subtotal0 = 0
  let subtotalIva = 0
  let descuento = 0
  for (const d of detalles) {
    const linea = redondear((Number(d.cantidad) || 0) * (Number(d.precio_unitario) || 0) - (Number(d.descuento) || 0))
    descuento += Number(d.descuento) || 0
    if (d.grava_iva) subtotalIva += linea
    else subtotal0 += linea
  }
  const iva = redondear((subtotalIva * ivaPorcentaje) / 100)
  return {
    subtotal_0: redondear(subtotal0),
    subtotal_iva: redondear(subtotalIva),
    descuento: redondear(descuento),
    iva,
    total: redondear(subtotal0 + subtotalIva + iva),
  }
}
