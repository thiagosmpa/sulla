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
exports.getCurrentUser = void 0;
exports.createController = createController;
const db_1 = __importDefault(require("../db"));
const getCurrentUser = (req, res) => {
    res.status(200).json({
        'status': 'success',
        current_user: {
            'id': '1234',
            'email': 'xxx'
        }
    });
};
exports.getCurrentUser = getCurrentUser;
function createController(req, res) {
    return __awaiter(this, void 0, void 0, function* () {
        const { email, username, password } = req.body;
        const findUniqueEmail = yield db_1.default.users.findUnique({
            where: {
                email: email
            }
        });
        const findUniqueUsername = yield db_1.default.users.findUnique({
            where: {
                username: username
            }
        });
        if (findUniqueEmail !== null || findUniqueUsername !== null) {
            return res.status(400).json({
                status: 'error',
                message: 'User already exists'
            });
        }
        else {
            try {
                const user = yield db_1.default.users.create({
                    data: {
                        email: email,
                        username: username,
                        password: password
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
