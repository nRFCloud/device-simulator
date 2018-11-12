"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const APPID = 'GPS';
const GPS_SEND_INTERVAL = 10000;
class default_1 {
    constructor(sensor, sendMessage) {
        this.sensor = sensor;
        this.sendMessage = sendMessage;
        this.lastGpsSend = 0;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendHello();
            this.sensor.on('data', (timestamp, data) => {
                if (Date.now() >= this.lastGpsSend + GPS_SEND_INTERVAL) {
                    const message = {
                        appId: APPID,
                        messageType: 'DATA',
                        data: String.fromCharCode.apply(null, data)
                    };
                    this.sendMessage(timestamp, message);
                    this.lastGpsSend = Date.now();
                }
            });
            if (!this.sensor.isStarted()) {
                yield this.sensor.start();
            }
        });
    }
    sendHello() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendMessage(Date.now(), {
                appId: APPID,
                messageType: 'HELLO',
            });
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sensor.stop();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=Gps.js.map