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
const APPID = 'DEVICE';
class default_1 {
    constructor(sensor, sendMessage) {
        this.sensor = sensor;
        this.sendMessage = sendMessage;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.sensor.on('data', (timestamp, data) => {
                const message = {
                    appId: APPID,
                    messageType: 'STATUS',
                    // @ts-ignore
                    data: String.fromCharCode.apply(null, data)
                };
                this.sendMessage(timestamp, message);
            });
            if (!this.sensor.isStarted()) {
                yield this.sensor.start();
            }
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sensor.stop();
        });
    }
}
exports.default = default_1;
//# sourceMappingURL=Device.js.map