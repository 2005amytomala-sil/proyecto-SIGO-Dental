import { Router } from 'express'
import {
  actualizarTratamiento,
  cambiarActivoTratamiento,
  crearTratamiento,
  listarCategorias,
  listarTratamientos,
  obtenerTratamiento,
} from '../controllers/tratamientos.controller.js'

const router = Router()

router.get('/', listarTratamientos)
router.get('/categorias', listarCategorias)
router.get('/:id', obtenerTratamiento)
router.post('/', crearTratamiento)
router.put('/:id', actualizarTratamiento)
router.patch('/:id/activo', cambiarActivoTratamiento)

export default router
