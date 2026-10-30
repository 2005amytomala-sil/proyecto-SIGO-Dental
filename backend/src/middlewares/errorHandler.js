export function notFound(req, res) {
  res.status(404).json({ mensaje: 'Recurso no encontrado' })
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(error, req, res, next) {
  if (error.code === '23505') {
    return res.status(409).json({ mensaje: 'Ya existe un registro con esos datos (cédula duplicada)' })
  }
  if (error.code === '23P01') {
    const mensaje = error.constraint === 'citas_sin_cruce_odontologo'
      ? 'El odontólogo ya tiene otra cita en ese horario'
      : 'El sillón ya está ocupado en ese horario (RN-03)'
    return res.status(409).json({ mensaje })
  }
  if (error.code === '23503') {
    return res.status(400).json({ mensaje: 'El paciente, odontólogo o sillón indicado no existe' })
  }
  console.error(error)
  res.status(error.status ?? 500).json({ mensaje: error.status ? error.message : 'Error interno del servidor' })
}
