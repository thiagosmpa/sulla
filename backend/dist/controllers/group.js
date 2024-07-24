"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentGroup = void 0;
const getCurrentGroup = (req, res) => {
    res.status(200).json({
        'status': 'success',
        current_user: {
            'id': '1234',
            'email': 'xxx'
        }
    });
};
exports.getCurrentGroup = getCurrentGroup;
