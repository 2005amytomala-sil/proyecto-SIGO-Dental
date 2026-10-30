import { apiFetch } from './api'

export const obtenerDocumentosClinicos = (pacienteId) => apiFetch(`/documentos-clinicos/paciente/${pacienteId}`)

export const crearReceta = (pacienteId, receta) =>
  apiFetch(`/documentos-clinicos/paciente/${pacienteId}/recetas`, { method: 'POST', body: receta })

export const crearConsentimiento = (pacienteId, consentimiento) =>
  apiFetch(`/documentos-clinicos/paciente/${pacienteId}/consentimientos`, { method: 'POST', body: consentimiento })
