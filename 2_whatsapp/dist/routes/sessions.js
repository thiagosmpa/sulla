"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const controllers_1 = require("../controllers");
const session_validator_1 = __importDefault(require("../middlewares/session-validator"));
const request_validator_1 = __importDefault(require("../middlewares/request-validator"));
const express_validator_1 = require("express-validator");
const router = (0, express_1.Router)();
router.get("/", controllers_1.session.list);
router.get("/:sessionId", session_validator_1.default, controllers_1.session.find);
router.get("/:sessionId/status", session_validator_1.default, controllers_1.session.status);
router.post("/add", (0, express_validator_1.body)("sessionId").isString().notEmpty(), request_validator_1.default, controllers_1.session.add);
exports.default = router;
