const formato = new Intl.NumberFormat('es-EC', { style: 'currency', currency: 'USD' })

export const formatearMoneda = (valor) => formato.format(Number(valor) || 0)
