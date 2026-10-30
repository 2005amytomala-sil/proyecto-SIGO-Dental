import { apiFetch } from './api'

export const listarCategorias = () => apiFetch('/tratamientos/categorias')

export function listarTratamientos({ buscar = '', categoria = '', incluirInactivos = false } = {}) {
  const params = new URLSearchParams()
  if (buscar) params.set('buscar', buscar)
  if (categoria) params.set('categoria', categoria)
  if (incluirInactivos) params.set('incluir_inactivos', 'true')
  return apiFetch(`/tratamientos?${params}`)
}

export const crearTratamiento = (tratamiento) => apiFetch('/tratamientos', { method: 'POST', body: tratamiento })

export const actualizarTratamiento = (id, tratamiento) =>
  apiFetch(`/tratamientos/${id}`, { method: 'PUT', body: tratamiento })

export const cambiarActivoTratamiento = (id, activo) =>
  apiFetch(`/tratamientos/${id}/activo`, { method: 'PATCH', body: { activo } })
