import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiFetch } from '../services/api'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setCargando(true)

    try {
      const respuesta = await apiFetch('/auth/login', {
        method: 'POST',
        body: { email, password },
      })

      localStorage.setItem('sigo_token', respuesta.token)
      localStorage.setItem('sigo_usuario', JSON.stringify(respuesta.usuario))

      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <section className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-800">SIGO-Dental</h1>
          <p className="mt-2 text-sm text-slate-500">
            Sistema Integral de Gestión Odontológica
          </p>
        </div>

        <h2 className="mb-6 text-xl font-semibold text-slate-800">
          Iniciar sesión
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Correo electrónico
            </label>
            <input
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="usuario@sigodental.com"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              placeholder="Ingresa tu contraseña"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={cargando}
            className="w-full rounded-lg bg-blue-700 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-60"
          >
            {cargando ? 'Verificando...' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-slate-400">
          Acceso exclusivo para personal autorizado
        </p>
      </section>
    </main>
  )
}