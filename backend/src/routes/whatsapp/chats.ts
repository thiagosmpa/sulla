import { Router } from 'express';
import {
    getAllChats
} from '../../controllers/whatsapp/chats';

const router = Router();

router.post('/users/get-chats', getAllChats)

export default router;