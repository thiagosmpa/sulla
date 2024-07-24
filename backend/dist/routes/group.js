"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const group_1 = require("../controllers/group");
const router = (0, express_1.Router)();
router.get('/groups/current-group', group_1.getCurrentGroup);
exports.default = router;
