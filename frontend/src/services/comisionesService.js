import { apiFetch } from './api'

export const listarConfiguracionComisiones = () => apiFetch('/comisiones/configuracion')
export const guardarConfiguracionComision = (comision) => apiFetch('/comisiones/configuracion', { method: 'POST', body: comision })
export const listarLiquidaciones = () => apiFetch('/comisiones/liquidaciones')
export const calcularLiquidacion = (facturaId) => apiFetch(`/comisiones/liquidaciones/factura/${facturaId}`, { method: 'POST' })
