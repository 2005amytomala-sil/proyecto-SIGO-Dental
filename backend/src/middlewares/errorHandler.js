export function notFound(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (error.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos (cédula duplicada)' })
  }
  console.error(error)
  res.status(error.status ?? 500).json({ mensaje: error.status ? error.message : 'Error interno del servidor' })
}
