import { EventEmitter } from 'events';
import { HostConnectionError, IHostConnection } from './HostConnection';
import { Configuration } from '../Configuration';
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../ShadowModel';

import { device, DeviceOptions } from 'aws-iot-device-sdk';

export class AWSIoTHostConnection extends EventEmitter implements IHostConnection {
    private config: Configuration;
    private mqtt?: device;
    private d2c?: string;
    private c2d?: string;
    private deltaEnabled: boolean;

    constructor(config: Configuration) {
        super();

        this.config = config;

        this.deltaEnabled = false;
    }

    private getShadowBaseTopic(): string {
        return `$aws/things/${this.config.clientId}/shadow`;
    }

    async updateShadow(reported: ShadowModelReported): Promise<void> {
        const root = {
            state: {
                reported
            }
        };

        return new Promise<void>((resolve, reject) => {
            this.mqtt!.publish(`${this.getShadowBaseTopic()}/update`, JSON.stringify(root), undefined, (error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    connect(): Promise<void> {
        return new Promise<void>((resolveConnect, rejectConnect) => {
            const connectOptions: DeviceOptions = {
                privateKey: Buffer.from(this.config.privateKey, 'utf8'),
                clientCert: Buffer.from(this.config.clientCert, 'utf8'),
                caCert: Buffer.from(this.config.caCert, 'utf8'),
                clientId: this.config.clientId,
                region: this.config.region || 'us-east-1',
                host: this.config.brokerHostname || 'a2n7tk1kp18wix.iot.us-east-1.amazonaws.com',
                debug: false
            };

            try {
                this.mqtt = new device(connectOptions);

                const shadowBaseTopic = this.getShadowBaseTopic();

                this.mqtt.subscribe(`${shadowBaseTopic}/get/accepted`);
            } catch (error) {
                rejectConnect(error);
            }

            this.mqtt!.on('error', (error: any) => {
                console.error(`AWS IoT error ${error.message}`);

                // Do a guess if gateway has been deleted on the backend
                if (this.mqtt
                    && error
                    && error.code === 'EPROTO'
                    && error.message.indexOf('alert certificate unknown') > -1
                    && error.message.indexOf('SSL alert number 46') > -1
                ) {
                    console.error(`This device has its certificate revoked.`);
                }
            });

            this.mqtt!.on('connect', () => {
                this.emit('connect');
                this.mqtt!.publish(`${this.getShadowBaseTopic()}/get`, '');

                if (resolveConnect) {
                    resolveConnect();
                }
            });

            this.mqtt!.on('close', () => {
                this.emit('disconnect');
            });

            this.mqtt!.on('reconnect', () => {
                this.emit('reconnect');
            });

            this.mqtt!.on('message', (topic: string, payload: any) => {
                if (payload == null || payload === '') {
                    return;
                }

                const shadowBaseTopic = this.getShadowBaseTopic();

                let parsed: any;

                switch (topic) {
                    case `${shadowBaseTopic}/get/accepted`:
                        parsed = JSON.parse(payload);
                        const shadow = <ShadowModel>Object.assign({}, parsed.state);
                        this.emit('shadowGetAccepted', shadow);

                        if (!this.deltaEnabled) {
                            this.deltaEnabled = true;
                            this.mqtt!.subscribe(`${shadowBaseTopic}/update/delta`);
                        }

                        break;
                    case `${shadowBaseTopic}/update/delta`:
                        parsed = JSON.parse(payload);
                        console.debug(`delta received ${JSON.stringify(parsed.state)}`);
                        const delta: any = <ShadowModelDesired>Object.assign({}, parsed.state);
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

    private async unsubscribeFromAll(): Promise<void> {
        const shadowBaseTopic = this.getShadowBaseTopic();

        this.mqtt!.unsubscribe(`${shadowBaseTopic}/get/accepted`);
        this.mqtt!.unsubscribe(`${shadowBaseTopic}/update/delta`);
        this.mqtt!.unsubscribe(`${shadowBaseTopic}/get`);

        await new Promise<void>((resolve, reject) => {
            if (this.c2d) {
                this.mqtt!.unsubscribe(this.c2d, undefined, (error?) => {
                    if (error) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            } else {
                resolve();
            }
        });
    }

    async disconnect(): Promise<void> {
        await this.unsubscribeFromAll();
        this.mqtt!.end(true);
    }

    async sendMessage(message: string): Promise<void> {
        if (!this.d2c) {
            throw new Error(`Application topic to send message to not provided.`);
        }

        if (!this.mqtt) {
            throw new HostConnectionError('No MQTT client provided.');
        }

        console.debug(`Sending message: ${message}`);
        return new Promise<void>((resolve, reject) => {
            this.mqtt!.publish(this.d2c!, message, undefined, (error?) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }

    async setTopics(c2d: string, d2c: string): Promise<void> {
        if (this.c2d) {
            console.info(`Already subscribed to topic '${this.c2d}'.`);
            return;
        }

        this.c2d = c2d;
        this.d2c = d2c;

        return new Promise<void>((resolve, reject) => {
            this.mqtt!.subscribe(c2d, undefined, (error?) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
