import { apiFetch } from './api'

export const listarInsumos = () => apiFetch('/inventario/insumos')
export const crearInsumo = (insumo) => apiFetch('/inventario/insumos', { method: 'POST', body: insumo })
export const registrarEntrada = (insumoId, entrada) => apiFetch(`/inventario/insumos/${insumoId}/entradas`, { method: 'POST', body: entrada })
export const listarMovimientos = () => apiFetch('/inventario/movimientos')
export const obtenerConfiguracionConsumo = (tratamientoId) => apiFetch(`/inventario/configuracion/${tratamientoId}`)
export const guardarConfiguracionConsumo = (tratamientoId, items) => apiFetch(`/inventario/configuracion/${tratamientoId}`, { method: 'PUT', body: { items } })
export const registrarDescargo = (descargo) => apiFetch('/inventario/descargos', { method: 'POST', body: descargo })
