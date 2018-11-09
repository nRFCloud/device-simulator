"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Gps_1 = require("./Gps");
const Temp_1 = require("./Temp");
const Flip_1 = require("./Flip");
const services = {
    acc: Flip_1.default,
    gps: Gps_1.default,
    temp: Temp_1.default,
};
exports.createService = (name, sensor, sendMessage) => new (services[name])(sensor, sendMessage);
//# sourceMappingURL=createService.js.map