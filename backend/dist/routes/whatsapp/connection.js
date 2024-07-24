"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const connection_1 = require("../../controllers/whatsapp/connection");
const router = (0, express_1.Router)();
router.post('/whatsapp/connect', connection_1.connect);
exports.default = router;
