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

  const token = localStorage.getItem('sigo_token')

  const headers = {
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  }

  try {
    respuesta = await fetch(`${API_URL}${ruta}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('No se pudo conectar con el servidor.', 0)
  }

  const datos = await respuesta.json().catch(() => null)

  if (!respuesta.ok) {
    if (respuesta.status === 401 && ruta !== '/auth/login') {
      localStorage.removeItem('sigo_token')
      localStorage.removeItem('sigo_usuario')
      window.location.href = '/login'
    }

    throw new ApiError(
      datos?.mensaje ?? 'Error inesperado',
      respuesta.status,
      datos?.errores,
    )
  }

  return datos
}