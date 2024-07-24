import { Router } from 'express';
import {
    getCurrentUser, 
    createController
} from '../controllers/user';

const router = Router();

router.get('/users/current-user', getCurrentUser)
router.post('/users/create-user', createController)

export default router;