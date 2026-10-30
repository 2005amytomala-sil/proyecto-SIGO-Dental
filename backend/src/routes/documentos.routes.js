import { Router } from 'express'
import {
  crearConsentimiento,
  crearReceta,
  obtenerDocumentos,
} from '../controllers/documentos.controller.js'

const router = Router()

router.get('/paciente/:pacienteId', obtenerDocumentos)
router.post('/paciente/:pacienteId/recetas', crearReceta)
router.post('/paciente/:pacienteId/consentimientos', crearConsentimiento)

export default router
