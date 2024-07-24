import { Router } from 'express';
import {
    connect
} from '../../controllers/whatsapp/connection';

const router = Router();

router.post('/whatsapp/connect', connect)

export default router;