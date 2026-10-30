import { apiFetch } from './api'

export const obtenerNotasSoep = (pacienteId) => apiFetch(`/soep/paciente/${pacienteId}`)

export const crearNotaSoep = (pacienteId, nota) =>
  apiFetch(`/soep/paciente/${pacienteId}`, { method: 'POST', body: nota })

export const crearAdendaSoep = (notaId, adenda) =>
  apiFetch(`/soep/nota/${notaId}/adendas`, { method: 'POST', body: adenda })
