import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { pool } from '../config/db.js'

export async function login(req, res) {
  try {
    const email = String(req.body.email ?? '').trim().toLowerCase()
    const password = String(req.body.password ?? '')

    if (!email || !password) {
      return res.status(400).json({
        mensaje: 'Ingresa tu correo y contraseña',
      })
    }

    const { rows } = await pool.query(
      `SELECT id, nombre, email, password_hash, rol, activo
       FROM usuarios
       WHERE email = $1`,
      [email],
    )

    const usuario = rows[0]

    if (!usuario || !usuario.activo) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas',
      })
    }

    const coincide = await bcrypt.compare(password, usuario.password_hash)

    if (!coincide) {
      return res.status(401).json({
        mensaje: 'Credenciales incorrectas',
      })
    }
    console.log('JWT configurado:', Boolean(process.env.AUTH_JWT_SECRET))
    console.log('Longitud JWT:', process.env.AUTH_JWT_SECRET?.length ?? 0)
    if (!process.env.AUTH_JWT_SECRET) {
      throw new Error('Falta configurar AUTH_JWT_SECRET')
    }

    const token = jwt.sign(
      {
        id: usuario.id,
        email: usuario.email,
        rol: usuario.rol,
      },
      process.env.AUTH_JWT_SECRET,
      { expiresIn: '8h' },
    )

    res.json({
      mensaje: 'Inicio de sesión correcto',
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol,
      },
    })
  } catch (error) {
    console.error('Error en login:', error)
    res.status(500).json({ mensaje: 'Error interno del servidor' })
  }
}