import { apiFetch } from './api'

export const listarOdontologos = () => apiFetch('/odontologos')

export const listarSillones = () => apiFetch('/sillones')

export function listarCitas({ desde, hasta, sillonId, odontologoId }) {
  const params = new URLSearchParams({ desde, hasta })
  if (sillonId) params.set('sillon_id', sillonId)
  if (odontologoId) params.set('odontologo_id', odontologoId)
  return apiFetch(`/citas?${params}`)
}

export const obtenerCita = (id) => apiFetch(`/citas/${id}`)

export const crearCita = (cita) => apiFetch('/citas', { method: 'POST', body: cita })

export const actualizarCita = (id, cita) => apiFetch(`/citas/${id}`, { method: 'PUT', body: cita })

export const cambiarEstadoCita = (id, estado, motivoCancelacion) =>
  apiFetch(`/citas/${id}/estado`, {
    method: 'PATCH',
    body: { estado, motivo_cancelacion: motivoCancelacion },
  })
