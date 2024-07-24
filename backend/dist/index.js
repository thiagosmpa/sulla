"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const server_1 = __importDefault(require("./server"));
const port = process.env.B_PORT || 3001;
server_1.default.listen(port, () => {
    console.log(`\n\nBACKEND running on port ${port}\n\n`);
});
