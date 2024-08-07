import { Router } from "express";
import { connect } from "../controllers/whatsappConnect";

const router = Router();

router.post("/whatsapp/connect", connect);

export default router;
