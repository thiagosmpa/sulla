"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const controllers_1 = require("../controllers");
const request_validator_1 = __importDefault(require("../middlewares/request-validator"));
const session_validator_1 = __importDefault(require("../middlewares/session-validator"));
const router = (0, express_1.Router)({ mergeParams: true });
router.get("/", (0, express_validator_1.query)("cursor").isNumeric().optional(), (0, express_validator_1.query)("limit").isNumeric().optional(), request_validator_1.default, controllers_1.group.list);
router.get("/:jid", session_validator_1.default, controllers_1.group.find);
router.get("/:jid/photo", session_validator_1.default, controllers_1.group.photo);
router.post("/create", (0, express_validator_1.body)("subject").isString().notEmpty(), 
// Participants up to 1024 (WhatsApp limit)
(0, express_validator_1.body)("participants").isArray({ min: 1, max: 1024 }).notEmpty(), request_validator_1.default, session_validator_1.default, controllers_1.group.create);
router.put("/:jid/update/participants", (0, express_validator_1.body)("participants").isArray({ min: 1, max: 1024 }).notEmpty(), (0, express_validator_1.body)("action").isString().isIn(["add", "remove", "demote", "promote"]).optional(), request_validator_1.default, session_validator_1.default, controllers_1.group.updateParticipants);
router.put("/:jid/update/subject", (0, express_validator_1.body)("subject").isString().notEmpty(), request_validator_1.default, session_validator_1.default, controllers_1.group.updateSubject);
router.put("/:jid/update/description", (0, express_validator_1.body)("description").isString().notEmpty(), request_validator_1.default, session_validator_1.default, controllers_1.group.updateDescription);
router.put("/:jid/update/setting", (0, express_validator_1.body)("action").isString().isIn(["announcement", "not_announcement", "unlocked", "locked"]).notEmpty(), request_validator_1.default, session_validator_1.default, controllers_1.group.updateSetting);
router.delete("/:jid", session_validator_1.default, controllers_1.group.leave);
exports.default = router;
