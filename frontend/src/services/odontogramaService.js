import { apiFetch } from './api'

export const obtenerCatalogoHallazgos = () => apiFetch('/odontograma/catalogo')

export const obtenerOdontograma = (pacienteId) => apiFetch(`/odontograma/paciente/${pacienteId}`)

export const crearRegistroOdontograma = (pacienteId, registro) =>
  apiFetch(`/odontograma/paciente/${pacienteId}`, { method: 'POST', body: registro })

export const anularRegistroOdontograma = (id, motivo) =>
  apiFetch(`/odontograma/${id}/anular`, { method: 'PATCH', body: { motivo } })
