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
const events_1 = require("events");
const HostConnection_1 = require("./HostConnection");
const aws_iot_device_sdk_1 = require("aws-iot-device-sdk");
class AWSIoTHostConnection extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.deltaEnabled = false;
    }
    getShadowBaseTopic() {
        return `$aws/things/${this.config.clientId}/shadow`;
    }
    updateShadow(reported) {
        return __awaiter(this, void 0, void 0, function* () {
            const root = {
                state: {
                    reported
                }
            };
            return new Promise((resolve, reject) => {
                this.mqtt.publish(`${this.getShadowBaseTopic()}/update`, JSON.stringify(root), undefined, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    connect() {
        return new Promise((resolveConnect, rejectConnect) => {
            const connectOptions = {
                privateKey: Buffer.from(this.config.privateKey, 'utf8'),
                clientCert: Buffer.from(this.config.clientCert, 'utf8'),
                caCert: Buffer.from(this.config.caCert, 'utf8'),
                clientId: this.config.clientId,
                region: this.config.region || 'us-east-1',
                host: this.config.brokerHostname || 'a2n7tk1kp18wix.iot.us-east-1.amazonaws.com',
                debug: false
            };
            try {
                this.mqtt = new aws_iot_device_sdk_1.device(connectOptions);
                const shadowBaseTopic = this.getShadowBaseTopic();
                this.mqtt.subscribe(`${shadowBaseTopic}/get/accepted`);
            }
            catch (error) {
                rejectConnect(error);
            }
            this.mqtt.on('error', (error) => {
                console.error(`AWS IoT error ${error.message}`);
                // Do a guess if gateway has been deleted on the backend
                if (this.mqtt
                    && error
                    && error.code === 'EPROTO'
                    && error.message.indexOf('alert certificate unknown') > -1
                    && error.message.indexOf('SSL alert number 46') > -1) {
                    console.error(`This device has its certificate revoked.`);
                }
            });
            this.mqtt.on('connect', () => {
                this.emit('connect');
                this.mqtt.publish(`${this.getShadowBaseTopic()}/get`, '');
                if (resolveConnect) {
                    resolveConnect();
                }
            });
            this.mqtt.on('close', () => {
                this.emit('disconnect');
            });
            this.mqtt.on('reconnect', () => {
                this.emit('reconnect');
            });
            this.mqtt.on('message', (topic, payload) => {
                if (payload == null || payload === '') {
                    return;
                }
                const shadowBaseTopic = this.getShadowBaseTopic();
                let parsed;
                switch (topic) {
                    case `${shadowBaseTopic}/get/accepted`:
                        parsed = JSON.parse(payload);
                        const shadow = Object.assign({}, parsed.state);
                        this.emit('shadowGetAccepted', shadow);
                        if (!this.deltaEnabled) {
                            this.deltaEnabled = true;
                            this.mqtt.subscribe(`${shadowBaseTopic}/update/delta`);
                        }
                        break;
                    case `${shadowBaseTopic}/update/delta`:
                        parsed = JSON.parse(payload);
                        console.debug(`delta received ${JSON.stringify(parsed.state)}`);
                        const delta = Object.assign({}, parsed.state);
                        this.emit('shadowDelta', delta);
                        break;
                    default:
                        parsed = JSON.parse(payload);
                        this.emit('message', parsed);
                        break;
                }
            });
        });
    }
    unsubscribeFromAll() {
        return __awaiter(this, void 0, void 0, function* () {
            const shadowBaseTopic = this.getShadowBaseTopic();
            this.mqtt.unsubscribe(`${shadowBaseTopic}/get/accepted`);
            this.mqtt.unsubscribe(`${shadowBaseTopic}/update/delta`);
            this.mqtt.unsubscribe(`${shadowBaseTopic}/get`);
            yield new Promise((resolve, reject) => {
                if (this.c2d) {
                    this.mqtt.unsubscribe(this.c2d, undefined, (error) => {
                        if (error) {
                            reject(error);
                        }
                        else {
                            resolve();
                        }
                    });
                }
                else {
                    resolve();
                }
            });
        });
    }
    disconnect() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.unsubscribeFromAll();
            this.mqtt.end(true);
        });
    }
    sendMessage(message) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.d2c) {
                throw new Error(`Application topic to send message to not provided.`);
            }
            if (!this.mqtt) {
                throw new HostConnection_1.HostConnectionError('No MQTT client provided.');
            }
            console.debug(`Sending message: ${message}`);
            return new Promise((resolve, reject) => {
                this.mqtt.publish(this.d2c, message, undefined, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
    setTopics(c2d, d2c) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.c2d) {
                console.info(`Already subscribed to topic '${this.c2d}'.`);
                return;
            }
            this.c2d = c2d;
            this.d2c = d2c;
            return new Promise((resolve, reject) => {
                this.mqtt.subscribe(c2d, undefined, (error) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve();
                    }
                });
            });
        });
    }
}
exports.AWSIoTHostConnection = AWSIoTHostConnection;
//# sourceMappingURL=AWSIoTHostConnection.js.map