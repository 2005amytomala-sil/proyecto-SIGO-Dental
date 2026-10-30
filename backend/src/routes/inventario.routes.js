import { Router } from 'express'
import {
  crearInsumo,
  guardarConfiguracion,
  listarInsumos,
  listarMovimientos,
  obtenerConfiguracion,
  registrarConsumo,
  registrarEntrada,
} from '../controllers/inventario.controller.js'

const router = Router()

router.get('/insumos', listarInsumos)
router.post('/insumos', crearInsumo)
router.post('/insumos/:insumoId/entradas', registrarEntrada)
router.get('/movimientos', listarMovimientos)
router.get('/configuracion/:tratamientoId', obtenerConfiguracion)
router.put('/configuracion/:tratamientoId', guardarConfiguracion)
router.post('/descargos', registrarConsumo)

export default router
