"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createController = exports.getAllUsers = exports.updateUser = exports.deleteUser = exports.getCurrentUser = void 0;
const db_1 = __importDefault(require("../db"));
const getCurrentUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { id } = req.body;
    try {
        const users = yield db_1.default.users.findUnique({
            where: {
                userId: id
            }
        });
        res.status(200).json({
            status: 'success',
            data: {
                users,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            error: error,
        });
    }
});
exports.getCurrentUser = getCurrentUser;
const deleteUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId } = req.body;
    try {
        const user = yield db_1.default.users.delete({
            where: {
                userId: userId,
            },
        });
        res.status(200).json({
            status: 'User Deleted',
            data: {
                user,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
});
exports.deleteUser = deleteUser;
const updateUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { userId, name, agenda, instructions } = req.body;
    const data = {};
    if (name)
        data.name = name;
    if (agenda)
        data.agenda = agenda;
    if (instructions)
        data.instructions = instructions;
    try {
        const user = yield db_1.default.users.update({
            where: { userId: userId },
            data: data,
        });
        res.status(200).json({
            status: 'User Updated',
            data: { user },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
        });
    }
});
exports.updateUser = updateUser;
const getAllUsers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield db_1.default.users.findMany();
        res.status(200).json({
            status: 'success',
            data: {
                users,
            },
        });
    }
    catch (error) {
        res.status(500).json({
            status: 'error',
            message: 'Something went wrong',
            error: error,
        });
    }
});
exports.getAllUsers = getAllUsers;
function createController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { id, name, agenda, instructions } = req.body;
        const findUniqueName = yield db_1.default.users.findUnique({
            where: {
                name: name
            }
        });
        if (findUniqueName !== null) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
        }
        else {
            try {
                const user = yield db_1.default.users.create({
                    data: {
                        name: name,
                        agenda: agenda,
                        instructions: instructions
                    }
                });
                res.status(200).json({
                    status: 'User Created',
                    user
                });
            }
            catch (error) {
                res.status(500).json({
                    status: 'error',
                    message: 'Internal server error'
                });
            }
        }
    });
}
exports.createController = createController;
