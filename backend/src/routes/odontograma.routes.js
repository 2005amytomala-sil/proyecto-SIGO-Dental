import { Router } from 'express'
import {
  anularRegistro,
  crearRegistro,
  obtenerCatalogo,
  obtenerOdontograma,
} from '../controllers/odontograma.controller.js'

const router = Router()

router.get('/catalogo', obtenerCatalogo)
router.get('/paciente/:pacienteId', obtenerOdontograma)
router.post('/paciente/:pacienteId', crearRegistro)
router.patch('/:id/anular', anularRegistro)

export default router
