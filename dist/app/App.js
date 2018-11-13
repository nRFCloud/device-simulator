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
const createService_1 = require("./services/createService");
class App {
    constructor(pairingEngine, hostConnection, sensors) {
        this.messagesSent = 0;
        this.sendMessage = (timestamp, message) => {
            const timeStamp = new Date(timestamp).toISOString();
            console.debug(`Timestamp in message #${this.messagesSent++}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
            console.debug(`messageId not sent in message since firmware implementation does not have it.`);
            this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
                console.error(`Error sending sensor data to nRF Cloud. Error is ${error.message}.`);
            });
        };
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.applicationStarted = false;
        this.services = Array.from(sensors.entries()).map(([name, sensor]) => createService_1.createService(name, sensor, this.sendMessage));
    }
    startApplication(pairing) {
        return __awaiter(this, void 0, void 0, function* () {
            if (pairing.state === 'paired') {
                if (pairing.topics && pairing.topics.d2c) {
                    yield this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);
                    for (const service of this.services) {
                        yield service.start();
                    }
                    this.applicationStarted = true;
                    console.info(`Pairing done, application started.`);
                }
                else {
                    console.warn('Paired but application topics are NOT provided by nRF Cloud.');
                }
            }
        });
    }
    stopApplication() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.applicationStarted) {
                for (const service of this.services) {
                    yield service.stop();
                }
                this.applicationStarted = false;
            }
        });
    }
    setupPairing() {
        this.pairingEngine.on('pairingUpdate', (state, status) => {
            console.debug(`updating shadow -> reported.pairing: ${JSON.stringify(state)} status: ${JSON.stringify(status)}`);
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
                console.debug(`shadow; json data not related to pairing: ${JSON.stringify(delta)}`);
                yield this.hostConnection.updateShadow(delta);
            }
        }));
    }
    main() {
        return __awaiter(this, void 0, void 0, function* () {
            this.setupPairing();
            this.hostConnection.on('reconnect', () => {
                console.info('Reconnecting to nRF Cloud.');
            });
            this.hostConnection.on('connect', () => {
                console.info('Connected to nRF Cloud.');
            });
            this.hostConnection.on('disconnect', () => {
                console.info('Disconnected from nRF Cloud.');
            });
            this.hostConnection.on('message', (message) => {
                const demopackMessage = Object.assign({}, message);
                console.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
            });
            yield this.hostConnection.connect();
        });
    }
}
exports.default = App;
//# sourceMappingURL=App.js.map