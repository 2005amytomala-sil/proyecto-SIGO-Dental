import { Router } from 'express'
import {
  calcularLiquidacion,
  guardarConfiguracion,
  listarConfiguracion,
  listarLiquidaciones,
} from '../controllers/comisiones.controller.js'

const router = Router()

router.get('/configuracion', listarConfiguracion)
router.post('/configuracion', guardarConfiguracion)
router.get('/liquidaciones', listarLiquidaciones)
router.post('/liquidaciones/factura/:facturaId', calcularLiquidacion)

export default router
