import { apiFetch } from './api'

export const obtenerPeriodontograma = (pacienteId) => apiFetch(`/periodontograma/paciente/${pacienteId}`)

export const crearRegistroPeriodontograma = (pacienteId, registro) =>
  apiFetch(`/periodontograma/paciente/${pacienteId}`, { method: 'POST', body: registro })
