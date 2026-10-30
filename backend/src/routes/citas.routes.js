import { Router } from 'express'
import {
  actualizarCita,
  cambiarEstadoCita,
  crearCita,
  listarCitas,
  obtenerCita,
} from '../controllers/citas.controller.js'

const router = Router()

router.get('/', listarCitas)
router.get('/:id', obtenerCita)
router.post('/', crearCita)
router.put('/:id', actualizarCita)
router.patch('/:id/estado', cambiarEstadoCita)

export default router
