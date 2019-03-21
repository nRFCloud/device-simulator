"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Gps_1 = require("./Gps");
const Temp_1 = require("./Temp");
const Flip_1 = require("./Flip");
const Humidity_1 = require("./Humidity");
const services = {
    acc: Flip_1.default,
    gps: Gps_1.default,
    temp: Temp_1.default,
    humid: Humidity_1.default,
};
exports.createService = (name, sensor, sendMessage) => {
    const Service = services[name];
    if (Service == null) {
        throw new Error(`No service for a sensor named '${name}' is known.`);
    }
    return new Service(sensor, sendMessage);
};
//# sourceMappingURL=createService.js.map