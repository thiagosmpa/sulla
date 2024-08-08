"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WAStatus = void 0;
var WAStatus;
(function (WAStatus) {
    WAStatus["Unknown"] = "unknown";
    WAStatus["WaitQrcodeAuth"] = "wait_for_qrcode_auth";
    WAStatus["Authenticated"] = "authenticated";
    WAStatus["PullingWAData"] = "pulling_wa_data";
    WAStatus["Connected"] = "connected";
    WAStatus["Disconected"] = "disconected";
})(WAStatus || (exports.WAStatus = WAStatus = {}));
