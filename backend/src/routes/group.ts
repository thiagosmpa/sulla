import { Router } from 'express';
import { getCurrentGroup } from '../controllers/group';

const router = Router();

router.get('/groups/current-group', getCurrentGroup)

export default router;

