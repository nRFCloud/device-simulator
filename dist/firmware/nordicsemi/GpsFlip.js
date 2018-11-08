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
const App_1 = require("./App/App");
let logger = require('winston');
class GpsFlip {
    constructor(pairingEngine, hostConnection, sensors, newLogger) {
        this.apps = [];
        this.sendMessage = (timestamp, message) => {
            const timeStamp = new Date(timestamp).toISOString();
            logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
            logger.debug(`messageId not sent in message since firmware implementation does not have it.`);
            this.state.messages.sent++;
            this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
                logger.error(`Error sending sensor data to nRF Cloud. Error is ${error.message}.`);
            });
        };
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
        if (newLogger) {
            logger = newLogger;
        }
    }
    startApplication(pairing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pairing.state === 'paired') {
                if (pairing.topics && pairing.topics.d2c) {
                    yield this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);
                    for (const app of this.apps) {
                        yield app.start();
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
    stopApplication() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.applicationStarted) {
                for (const app of this.apps) {
                    yield app.stop();
                }
                this.applicationStarted = false;
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
                else if (delta.pairing.state !== 'paired' && this.applicationStarted) {
                    yield this.stopApplication();
                }
            }
            else {
                // Some application specific state is desired, reply back as reported and process afterwards
                logger.debug(`shadow; json data not related to pairing: ${JSON.stringify(delta)}`);
                yield this.hostConnection.updateShadow(delta);
            }
        }));
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
            this.apps = Array.from(this.sensors.entries()).map(([name, sensor]) => App_1.createApp(name, sensor, this.sendMessage));
            this.hostConnection.on('message', (message) => {
                const demopackMessage = Object.assign({}, message);
                logger.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
            });
            yield this.hostConnection.connect();
            return new Promise(() => {
            });
        });
    }
}
exports.GpsFlip = GpsFlip;
//# sourceMappingURL=GpsFlip.js.map