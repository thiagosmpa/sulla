import { Router } from 'express'
import { checkConnection } from '../controllers/whatsapp'

const router = Router()

router.get('/whatsapp', checkConnection)

export default router