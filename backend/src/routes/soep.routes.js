import { Router } from 'express'
import {
  crearAdendaSoep,
  crearNotaSoep,
  obtenerNotasSoep,
} from '../controllers/soep.controller.js'

const router = Router()

router.get('/paciente/:pacienteId', obtenerNotasSoep)
router.post('/paciente/:pacienteId', crearNotaSoep)
router.post('/nota/:notaId/adendas', crearAdendaSoep)

export default router
