import jwt from 'jsonwebtoken'

export function verificarToken(req, res, next) {
  const autorizacion = req.headers.authorization
  const token = autorizacion?.startsWith('Bearer ')
    ? autorizacion.slice(7)
    : null

  if (!token) {
    return res.status(401).json({ mensaje: 'Debes iniciar sesión' })
  }

  try {
    req.usuario = jwt.verify(token, process.env.AUTH_JWT_SECRET)
    next()
  } catch {
    return res.status(401).json({
      mensaje: 'Sesión inválida o expirada. Inicia sesión nuevamente.',
    })
  }
}