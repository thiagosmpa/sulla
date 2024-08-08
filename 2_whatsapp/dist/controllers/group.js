"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.leave = exports.updateDescription = exports.updateSetting = exports.updateSubject = exports.updateParticipants = exports.create = exports.photo = exports.find = exports.list = void 0;
const shared_1 = require("../shared");
const whatsapp_1 = require("../whatsapp");
const misc_1 = require("./misc");
const db_1 = require("../db");
const list = async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { cursor = undefined, limit = 25, search } = req.query;
        const groups = await db_1.prisma.contact.findMany({
            cursor: cursor ? { pkId: Number(cursor) } : undefined,
            take: Number(limit),
            skip: cursor ? 1 : 0,
            where: {
                id: { endsWith: "g.us" },
                sessionId,
                OR: [
                    {
                        name: {
                            contains: String(search),
                        }
                    }
                ]
            },
        });
        res.status(200).json({
            data: groups,
            cursor: groups.length !== 0 && groups.length === Number(limit)
                ? groups[groups.length - 1].pkId
                : null,
        });
    }
    catch (e) {
        const message = "An error occured during group list";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.list = list;
const find = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        const data = await session.groupMetadata(jid);
        res.status(200).json(data);
    }
    catch (e) {
        const message = "An error occured during group metadata fetch";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.find = find;
exports.photo = (0, misc_1.makePhotoURLHandler)("group");
const create = async (req, res) => {
    try {
        const session = (0, whatsapp_1.getSession)(req.params.sessionId);
        const { subject, participants } = req.body;
        if (!Array.isArray(participants) || participants.length < 1) {
            return res.status(400).json({ error: "Participants must be an array and have at least 1 members"
            });
        }
        else if (subject.length > 100) {
            return res.status(400).json({ error: "Subject must be less than 100 characters"
            });
        }
        const listNumbersNotExists = [];
        participants.forEach(async (participant) => {
            const exists = await (0, whatsapp_1.jidExists)(session, participant);
            if (!exists) {
                listNumbersNotExists.push(participant);
            }
        });
        const data = await session.groupCreate(subject, participants);
        res.status(200).json({
            data,
            error: listNumbersNotExists.length > 0 ? `The following numbers do not exist: ${listNumbersNotExists.join(", ")}` : null,
        });
    }
    catch (e) {
        const message = "An error occured during group creation";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.create = create;
const updateParticipants = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        const { participants, action = "add" } = req.body;
        if (!Array.isArray(participants) || participants.length < 1) {
            return res.status(400).json({ error: "Participants must be an array and have at least 1 members"
            });
        }
        const listNumbersNotExists = [];
        participants.forEach(async (participant) => {
            const exists = await (0, whatsapp_1.jidExists)(session, participant);
            if (!exists) {
                listNumbersNotExists.push(participant);
            }
        });
        const data = await session.groupParticipantsUpdate(jid, participants, action);
        res.status(200).json({
            data,
            error: listNumbersNotExists.length > 0 ? `The following numbers do not exist: ${listNumbersNotExists.join(", ")}` : null,
        });
    }
    catch (e) {
        const message = "An error occured during group participants update";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.updateParticipants = updateParticipants;
const updateSubject = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        const { subject } = req.body;
        if (subject.length > 100) {
            return res.status(400).json({ error: "Subject must be less than 100 characters"
            });
        }
        await session.groupUpdateSubject(jid, subject);
        res.status(200).json({
            message: "Group subject updated",
        });
    }
    catch (e) {
        const message = "An error occured during group subject update";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.updateSubject = updateSubject;
const updateSetting = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        const { action } = req.body;
        await session.groupSettingUpdate(jid, action);
        res.status(200).json({
            message: "Group setting updated",
        });
    }
    catch (e) {
        const message = "An error occured during group setting update";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.updateSetting = updateSetting;
const updateDescription = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        const { description } = req.body;
        await session.groupUpdateDescription(jid, description);
        res.status(200).json({
            message: "Group description updated",
        });
    }
    catch (e) {
        const message = "An error occured during group subject update";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.updateDescription = updateDescription;
const leave = async (req, res) => {
    try {
        const { sessionId, jid } = req.params;
        const session = (0, whatsapp_1.getSession)(sessionId);
        await session.groupLeave(jid);
        res.status(200).json({
            message: "Group leaved",
        });
    }
    catch (e) {
        const message = "An error occured during group leave";
        shared_1.logger.error(e, message);
        res.status(500).json({ error: message });
    }
};
exports.leave = leave;
