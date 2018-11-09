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
const FakeAccelerometer_1 = require("../../sensors/FakeAccelerometer");
const APPID = 'FLIP';
var Orientation;
(function (Orientation) {
    Orientation[Orientation["NORMAL"] = 0] = "NORMAL";
    Orientation[Orientation["UPSIDE_DOWN"] = 1] = "UPSIDE_DOWN";
})(Orientation || (Orientation = {}));
const convertToInt8 = (data) => {
    const dest = new Int8Array(data.length);
    data.forEach((value, idx) => {
        dest[idx] = value << 24 >> 24;
    });
    return dest;
};
class default_1 {
    constructor(sensor, sendMessage) {
        this.sensor = sensor;
        this.sendMessage = sendMessage;
        this.currentOrientation = Orientation.NORMAL;
        this.orientationChange = false;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.sendHello();
            this.sensor.on('data', (timestamp, data) => {
                const sample = FakeAccelerometer_1.Sample.fromArray(convertToInt8(data));
                this.updateOrientation(sample);
                if (this.orientationChange) {
                    this.orientationChange = false;
                    const message = {
                        appId: APPID,
                        messageType: 'DATA',
                        data: this.orientation
                    };
                    this.sendMessage(timestamp, message);
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
    get orientation() {
        switch (this.currentOrientation) {
            case Orientation.NORMAL:
                return 'NORMAL';
            case Orientation.UPSIDE_DOWN:
                return 'UPSIDE_DOWN';
            default:
                console.error(`Unknown orientation`);
                return '';
        }
    }
    updateOrientation(sample) {
        const previousOrientation = this.currentOrientation;
        switch (this.currentOrientation) {
            case Orientation.NORMAL:
                if (sample.Z < -40) {
                    this.currentOrientation = Orientation.UPSIDE_DOWN;
                }
                break;
            case Orientation.UPSIDE_DOWN:
                if (sample.Z > 40) {
                    this.currentOrientation = Orientation.NORMAL;
                }
                break;
            default:
                break;
        }
        this.orientationChange = previousOrientation !== this.currentOrientation;
    }
}
exports.default = default_1;
//# sourceMappingURL=Flip.js.map