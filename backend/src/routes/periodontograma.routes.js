import { Router } from 'express'
import {
  crearRegistroPeriodontograma,
  obtenerPeriodontograma,
} from '../controllers/periodontograma.controller.js'

const router = Router()

router.get('/paciente/:pacienteId', obtenerPeriodontograma)
router.post('/paciente/:pacienteId', crearRegistroPeriodontograma)

export default router
