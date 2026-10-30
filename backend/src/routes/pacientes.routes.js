import { Router } from 'express'
import {
  actualizarPaciente,
  crearPaciente,
  listarPacientes,
  obtenerPaciente,
} from '../controllers/pacientes.controller.js'

const router = Router()

router.get('/', listarPacientes)
router.get('/:id', obtenerPaciente)
router.post('/', crearPaciente)
router.put('/:id', actualizarPaciente)

export default router
