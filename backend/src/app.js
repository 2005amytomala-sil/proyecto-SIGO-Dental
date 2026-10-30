import express from 'express'
import cors from 'cors'
import pacientesRoutes from './routes/pacientes.routes.js'
import { errorHandler, notFound } from './middlewares/errorHandler.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/api/health', (req, res) => res.json({ estado: 'ok' }))
app.use('/api/pacientes', pacientesRoutes)

app.use(notFound)
app.use(errorHandler)

export default app
