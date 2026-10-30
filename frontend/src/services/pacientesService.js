import { apiFetch } from './api'

export function listarPacientes({ buscar = '', pagina = 1, limite = 10 } = {}) {
  const params = new URLSearchParams({ buscar, pagina, limite })
  return apiFetch(`/pacientes?${params}`)
}

export function obtenerPaciente(id) {
  return apiFetch(`/pacientes/${id}`)
}

export function crearPaciente(paciente) {
  return apiFetch('/pacientes', { method: 'POST', body: paciente })
}

export function actualizarPaciente(id, paciente) {
  return apiFetch(`/pacientes/${id}`, { method: 'PUT', body: paciente })
}
