"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const professional_1 = require("../controllers/professional");
const router = (0, express_1.Router)();
router.get('/professionals/current-professional', professional_1.getCurrentProfessional);
exports.default = router;
