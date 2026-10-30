import express from 'express'
import cors from 'cors'
import pacientesRoutes from './routes/pacientes.routes.js'
import tratamientosRoutes from './routes/tratamientos.routes.js'
import facturasRoutes from './routes/facturas.routes.js'
import odontogramaRoutes from './routes/odontograma.routes.js'
import periodontogramaRoutes from './routes/periodontograma.routes.js'
import soepRoutes from './routes/soep.routes.js'
import documentosRoutes from './routes/documentos.routes.js'
import inventarioRoutes from './routes/inventario.routes.js'
import citasRoutes from './routes/citas.routes.js'
import catalogosRoutes from './routes/catalogos.routes.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

const app = express()

const allowedOrigins = process.env.FRONTEND_URL
  ?.split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

app.use(cors(allowedOrigins?.length ? { origin: allowedOrigins } : undefined))
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }))
app.use('/api/pacientes', pacientesRoutes)
app.use('/api/citas', citasRoutes)
app.use('/api/tratamientos', tratamientosRoutes)
app.use('/api/facturas', facturasRoutes)
app.use('/api/odontograma', odontogramaRoutes)
app.use('/api/periodontograma', periodontogramaRoutes)
app.use('/api/soep', soepRoutes)
app.use('/api/documentos-clinicos', documentosRoutes)
app.use('/api/inventario', inventarioRoutes)
app.use('/api', catalogosRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
