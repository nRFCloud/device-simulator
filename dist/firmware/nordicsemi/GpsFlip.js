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
const Firmware_1 = require("../Firmware");
const FakeAccelerometer_1 = require("../../sensors/FakeAccelerometer");
//
// Simulate behaviour of Alta device:
//   https://projecttools.nordicsemi.no/jira/browse/IS-1130
//
let logger = require('winston');
const GPS = 'GPS';
const GPS_SEND_INTERVAL = 10000;
const FLIP = 'FLIP';
var Orientation;
(function (Orientation) {
    Orientation[Orientation["NORMAL"] = 0] = "NORMAL";
    Orientation[Orientation["UPSIDE_DOWN"] = 1] = "UPSIDE_DOWN";
})(Orientation || (Orientation = {}));
class Gps {
    constructor() {
        this.lastGpsSend = 0;
    }
}
class Flip {
    constructor() {
        this.currentOrientation = Orientation.NORMAL;
        this.lastOrientationChange = 0;
    }
    update(timestamp, sample) {
        this.updateOrientation(timestamp, sample);
    }
    get orientation() {
        switch (this.currentOrientation) {
            case Orientation.NORMAL:
                return 'NORMAL';
            case Orientation.UPSIDE_DOWN:
                return 'UPSIDE_DOWN';
            default:
                logger.error(`Unknown orientation`);
                return '';
        }
    }
    updateOrientation(timestamp, sample) {
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
        if (previousOrientation !== this.currentOrientation) {
            this.lastOrientationChange = timestamp;
            this.orientationChange = true;
        }
        logger.debug(`orientation: ${previousOrientation} -> ${this.currentOrientation} @${new Date(this.lastOrientationChange).toISOString()}: ${JSON.stringify(sample)}`);
    }
    isChanged() {
        const retval = this.orientationChange;
        this.orientationChange = false;
        return retval;
    }
}
class GpsFlip {
    constructor(config, pairingEngine, hostConnection, sensors, newLogger) {
        this.config = config;
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.state = {
            connects: 0,
            connected: false,
            messages: {
                sent: 0,
                received: 0,
            },
        };
        this.sensors = sensors;
        this.applicationStarted = false;
        if (newLogger) {
            logger = newLogger;
        }
    }
    sendGeneric(appId, messageType, timestamp) {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        const message = {
            appId,
            messageId: this.state.messages.sent,
            messageType: messageType,
        };
        this.state.messages.sent++;
        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending ${messageType} to nRF Cloud. Error is ${error.message}.`);
        });
    }
    sendGpsData(timestamp, data) {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        const message = {
            appId: GPS,
            messageId: this.state.messages.sent,
            messageType: 'DATA',
            data
        };
        this.state.messages.sent++;
        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending GPS sensor data to nRF Cloud. Error is ${error.message}.`);
        });
    }
    sendFlipData(timestamp, data) {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        const message = {
            appId: FLIP,
            messageId: this.state.messages.sent,
            messageType: 'DATA',
            data
        };
        this.state.messages.sent++;
        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending FLIP data to nRF Cloud. Error is ${error.message}.`);
        });
    }
    startApplication(pairing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pairing.state === 'paired') {
                if (pairing.topics && pairing.topics.d2c) {
                    yield this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);
                    if (this.gps) {
                        yield this.sendGeneric(GPS, 'HELLO', Date.now());
                    }
                    if (this.flip) {
                        yield this.sendGeneric(FLIP, 'HELLO', Date.now());
                    }
                    this.applicationStarted = true;
                    logger.info(`Pairing done, application started.`);
                }
                else {
                    logger.warn('Paired but application topics are NOT provided by nRF Cloud.');
                }
            }
        });
    }
    setupPairing() {
        this.pairingEngine.on('pairingUpdate', (state, status) => {
            logger.debug(`gpsFlip; updating shadow -> reported.pairing: ${JSON.stringify(state)} status: ${JSON.stringify(status)}`);
            this.hostConnection.updateShadow({
                pairing: state === null ? undefined : state,
                pairingStatus: status,
            });
        });
        this.hostConnection.on('shadowGetAccepted', (shadow) => __awaiter(this, void 0, void 0, function* () {
            this.pairingEngine.updatePairingState(shadow.desired.pairing);
            if (shadow.desired.pairing && shadow.desired.pairing.state === 'paired') {
                yield this.startApplication(shadow.desired.pairing);
            }
        }));
        this.hostConnection.on('shadowDelta', (delta) => __awaiter(this, void 0, void 0, function* () {
            if (delta.pairing) {
                this.pairingEngine.updatePairingState(delta.pairing);
                if (delta.pairing.state === 'paired') {
                    yield this.startApplication(delta.pairing);
                }
            }
            else {
                // Some application specific state is desired, reply back as reported and process afterwards
                logger.debug(`shadow; json data not related to pairing: ${JSON.stringify(delta)}`);
                yield this.hostConnection.updateShadow(delta);
            }
        }));
    }
    static convertToInt8(data) {
        const dest = new Int8Array(data.length);
        data.forEach((value, idx) => {
            dest[idx] = value << 24 >> 24;
        });
        return dest;
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.sensors) {
                throw new Firmware_1.FirmwareError('Sensors not provided. Required by GpsFlip.');
            }
            this.setupPairing();
            this.hostConnection.on('reconnect', () => {
                logger.info('Reconnecting to nRF Cloud.');
            });
            this.hostConnection.on('connect', () => {
                logger.info('Connected to nRF Cloud.');
            });
            this.hostConnection.on('disconnect', () => {
                logger.info('Disconnected from nRF Cloud.');
            });
            const gps = this.sensors.get('gps');
            if (gps) {
                this.gps = new Gps();
            }
            const acc = this.sensors.get('acc');
            if (acc) {
                this.flip = new Flip();
            }
            this.hostConnection.on('message', (message) => {
                const demopackMessage = Object.assign({}, message);
                if (gps != null && demopackMessage.appId === GPS && demopackMessage.messageType === 'OK' &&
                    this.applicationStarted === true && !gps.isStarted()) {
                    gps.start();
                    logger.info(`Received GPS message ${JSON.stringify(demopackMessage)}`);
                }
                else if (acc != null && demopackMessage.appId === FLIP && demopackMessage.messageType === 'OK' &&
                    this.applicationStarted === true && !acc.isStarted()) {
                    acc.start();
                    logger.info(`Received FLIP message ${JSON.stringify(demopackMessage)}`);
                }
                else {
                    logger.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}, applicationStarted: ${this.applicationStarted}`);
                }
            });
            if (gps) {
                gps.on('data', (timestamp, data) => {
                    if (Date.now() >= this.gps.lastGpsSend + GPS_SEND_INTERVAL) {
                        this.sendGpsData(timestamp, String.fromCharCode.apply(null, data));
                        this.gps.lastGpsSend = Date.now();
                    }
                });
            }
            if (acc) {
                acc.on('data', (timestamp, data) => {
                    const sample = FakeAccelerometer_1.Sample.fromArray(GpsFlip.convertToInt8(data));
                    this.flip.update(timestamp, sample);
                    if (this.flip.isChanged()) {
                        this.sendFlipData(timestamp, this.flip.orientation);
                    }
                });
            }
            yield this.hostConnection.connect();
            return new Promise(() => {
            });
        });
    }
}
exports.GpsFlip = GpsFlip;
//# sourceMappingURL=GpsFlip.js.map