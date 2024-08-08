"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useSession = void 0;
const baileys_1 = require("@whiskeysockets/baileys");
const baileys_2 = require("@whiskeysockets/baileys");
const db_1 = require("../db");
const shared_1 = require("../shared");
const library_1 = require("@prisma/client/runtime/library");
const fixId = (id) => id.replace(/\//g, "__").replace(/:/g, "-");
async function useSession(sessionId) {
    const model = db_1.prisma.session;
    const write = async (data, id) => {
        try {
            data = JSON.stringify(data, baileys_2.BufferJSON.replacer);
            id = fixId(id);
            await model.upsert({
                select: { pkId: true },
                create: { data, id, sessionId },
                update: { data },
                where: { sessionId_id: { id, sessionId } },
            });
        }
        catch (e) {
            shared_1.logger.error(e, "An error occured during session write");
        }
    };
    const read = async (id) => {
        try {
            const result = await model.findUnique({
                select: { data: true },
                where: { sessionId_id: { id: fixId(id), sessionId } },
            });
            if (!result) {
                shared_1.logger.info({ id }, "Trying to read non existent session data");
                return null;
            }
            return JSON.parse(result.data, baileys_2.BufferJSON.reviver);
        }
        catch (e) {
            if (e instanceof library_1.PrismaClientKnownRequestError && e.code === "P2025") {
                shared_1.logger.info({ id }, "Trying to read non existent session data");
            }
            else {
                shared_1.logger.error(e, "An error occured during session read");
            }
            return null;
        }
    };
    const del = async (id) => {
        try {
            await model.delete({
                select: { pkId: true },
                where: { sessionId_id: { id: fixId(id), sessionId } },
            });
        }
        catch (e) {
            shared_1.logger.error(e, "An error occured during session delete");
        }
    };
    const creds = (await read("creds")) || (0, baileys_2.initAuthCreds)();
    return {
        state: {
            creds,
            keys: {
                get: async (type, ids) => {
                    const data = {};
                    await Promise.all(ids.map(async (id) => {
                        let value = await read(`${type}-${id}`);
                        if (type === "app-state-sync-key" && value) {
                            value = baileys_1.proto.Message.AppStateSyncKeyData.fromObject(value);
                        }
                        data[id] = value;
                    }));
                    return data;
                },
                set: async (data) => {
                    const tasks = [];
                    for (const category in data) {
                        for (const id in data[category]) {
                            const value = data[category][id];
                            const sId = `${category}-${id}`;
                            tasks.push(value ? write(value, sId) : del(sId));
                        }
                    }
                    await Promise.all(tasks);
                },
            },
        },
        saveCreds: () => write(creds, "creds"),
    };
}
exports.useSession = useSession;
