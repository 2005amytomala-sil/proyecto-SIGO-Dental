import { apiFetch } from './api'

export const obtenerConfiguracionFacturacion = () => apiFetch('/facturas/configuracion')

export function listarFacturas({ desde, hasta, buscar = '', estado = '', pagina = 1, limite = 10 }) {
  const params = new URLSearchParams({ pagina, limite })
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  if (buscar) params.set('buscar', buscar)
  if (estado) params.set('estado', estado)
  return apiFetch(`/facturas?${params}`)
}

export const obtenerFactura = (id) => apiFetch(`/facturas/${id}`)

export const crearFactura = (factura) => apiFetch('/facturas', { method: 'POST', body: factura })

export const anularFactura = (id, motivo) => apiFetch(`/facturas/${id}/anular`, { method: 'PATCH', body: { motivo } })
