"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCurrentProfessional = void 0;
const getCurrentProfessional = (req, res) => {
    res.status(200).json({
        'status': 'success',
        current_user: {
            'id': '1234',
            'email': 'xxx'
        }
    });
};
exports.getCurrentProfessional = getCurrentProfessional;
