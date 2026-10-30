import { Router } from 'express'
import { listarOdontologos, listarSillones } from '../controllers/catalogos.controller.js'

const router = Router()

router.get('/odontologos', listarOdontologos)
router.get('/sillones', listarSillones)

export default router
