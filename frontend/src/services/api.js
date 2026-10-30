const API_URL = import.meta.env.VITE_API_URL ?? '/api'

export class ApiError extends Error {
  constructor(mensaje, status, errores = {}) {
    super(mensaje)
    this.status = status
    this.errores = errores
  }
}

export async function apiFetch(ruta, { method = 'GET', body } = {}) {
  let respuesta
  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor. ¿Está encendido el backend?', 0)
  }

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok) {
    throw new ApiError(datos?.mensaje ?? 'Error inesperado', respuesta.status, datos?.errores)
  }
  return datos
}
