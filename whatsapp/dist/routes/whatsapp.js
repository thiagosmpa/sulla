"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const whatsapp_1 = require("../controllers/whatsapp");
const router = (0, express_1.Router)();
router.get('/whatsapp/connect', whatsapp_1.connectWhatsApp);
router.get('/whatsapp/send-message', whatsapp_1.sendTestMessage);
router.get('/whatsapp', whatsapp_1.checkConnection);
exports.default = router;
