import { Router } from 'express'
import {
  anularFactura,
  crearFactura,
  listarFacturas,
  obtenerConfiguracion,
  obtenerFactura,
} from '../controllers/facturas.controller.js'

const router = Router()

router.get('/', listarFacturas)
router.get('/configuracion', obtenerConfiguracion)
router.get('/:id', obtenerFactura)
router.post('/', crearFactura)
router.patch('/:id/anular', anularFactura)

export default router
