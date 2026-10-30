import express from 'express'
import cors from 'cors'
import pacientesRoutes from './routes/pacientes.routes.js'
import tratamientosRoutes from './routes/tratamientos.routes.js'
import citasRoutes from './routes/citas.routes.js'
import catalogosRoutes from './routes/catalogos.routes.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }))
app.use('/api/pacientes', pacientesRoutes)
app.use('/api/citas', citasRoutes)
app.use('/api/tratamientos', tratamientosRoutes)
app.use('/api', catalogosRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
