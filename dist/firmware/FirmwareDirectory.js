"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Firmware_1 = require("./Firmware");
const GpsFlip_1 = require("./nordicsemi/GpsFlip");
class FirmwareDirectory {
    constructor(pairingEngine, hostConnection, sensors) {
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.sensors = sensors;
        this.firmware = new Map();
    }
    create() {
        this.firmware.set('nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0', new GpsFlip_1.GpsFlip(this.pairingEngine, this.hostConnection, this.sensors));
    }
    getFirmwareList() {
        if (!this.firmware) {
            throw new Firmware_1.FirmwareError(`No firmware registered with directory.`);
        }
        const keys = this.firmware.keys();
        const retval = [];
        for (let key of keys) {
            retval.push(key);
        }
        return retval;
    }
    getFirmware(firmware) {
        if (!this.firmware) {
            throw new Firmware_1.FirmwareError(`No firmware registered with directory.`);
        }
        if (!this.firmware.get(firmware)) {
            throw new Firmware_1.FirmwareError(`Firmware with nsrn '${firmware}' does not exist.`);
        }
        return this.firmware.get(firmware);
    }
}
exports.FirmwareDirectory = FirmwareDirectory;
//# sourceMappingURL=FirmwareDirectory.js.map