"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const chats_1 = require("../../controllers/whatsapp/chats");
const router = (0, express_1.Router)();
router.post('/users/get-chats', chats_1.getAllChats);
exports.default = router;
