import { Router } from 'express';
import { getCurrentProfessional } from '../controllers/professional';

const router = Router();

router.get('/professionals/current-professional', getCurrentProfessional)

export default router;

