import { FirmwareError, FirmwareState, IFirmware, MessageStatus } from '../Firmware';
import { ConfigurationData } from '../../ConfigurationStorage';
import { IPairingEngine } from '../../pairing/PairingEngine';
import { IHostConnection } from '../../connection/HostConnection';
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../../ShadowModel';
import { ISensor } from '../../sensors/Sensor';
import { DemopackMessage } from './GpsFlipModel';
import { Pairing } from '../../pairing/Pairing';
import { Sample } from '../../sensors/FakeAccelerometer';

//
// Simulate behaviour of Alta device:
//   https://projecttools.nordicsemi.no/jira/browse/IS-1130
//

let logger = require('winston');

const GPS = 'GPS';
const GPS_SEND_INTERVAL = 10000;

const FLIP = 'FLIP';

const TEMP = 'TEMP';

enum Orientation {
    NORMAL,
    UPSIDE_DOWN,
}

class Gps {
    lastGpsSend: number;
    gps: ISensor;

    constructor(gps: ISensor) {
        this.lastGpsSend = 0;
        this.gps = gps;
    }


    get sensor(): ISensor {
        return this.gps;
    }
}

class Flip {
    private currentOrientation: Orientation;
    private lastOrientationChange: number;
    private orientationChange: boolean;
    private acc: ISensor;

    constructor(acc: ISensor) {
        this.currentOrientation = Orientation.NORMAL;
        this.lastOrientationChange = 0;
        this.acc = acc;
    }

    get sensor(): ISensor {
        return this.acc;
    }

    update(timestamp: number, sample: Sample) {
        this.updateOrientation(timestamp, sample);
    }

    get orientation(): string {
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

    private updateOrientation(timestamp: number, sample: Sample) {
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

    isChanged(): boolean {
        const retval = this.orientationChange;
        this.orientationChange = false;
        return retval;
    }
}

class Temp {
    constructor(readonly sensor: ISensor) { }
}

export class GpsFlip implements IFirmware {
    private config: ConfigurationData;
    private pairingEngine: IPairingEngine;
    private state: FirmwareState;
    private hostConnection: IHostConnection;
    private applicationStarted: boolean;
    private sensors: Map<string, ISensor>;
    private gps: Gps;
    private flip: Flip;
    private temp: Temp;

    constructor(
        config: ConfigurationData,
        pairingEngine: IPairingEngine,
        hostConnection: IHostConnection,
        sensors: Map<string, ISensor>,
        newLogger?: any) {
        this.config = config;
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.state = <FirmwareState>{
            connects: 0,
            connected: false,
            messages: <MessageStatus>{
                sent: 0,
                received: 0,
            },
        };
        this.sensors = sensors;

        if (newLogger) {
            logger = newLogger;
        }
    }

    private sendGeneric(appId: string, messageType: string, timestamp: number): void {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        logger.debug(`messageId not sent in message since firmware implementation does not have it.`);

        const message = <DemopackMessage>{
            appId,
            messageType: messageType,
        };

        this.state.messages.sent++;

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending ${messageType} to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private sendGpsData(timestamp: number, data: string): void {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        logger.debug(`messageId not sent in message since firmware implementation does not have it.`);

        const message = <DemopackMessage>{
            appId: GPS,
            messageType: 'DATA',
            data
        };

        this.state.messages.sent++;

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending GPS sensor data to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private sendFlipData(timestamp: number, data: any): void {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        logger.debug(`messageId not sent in message since firmware implementation does not have it.`);

        const message = <DemopackMessage>{
            appId: FLIP,
            messageType: 'DATA',
            data
        };

        this.state.messages.sent++;

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending FLIP data to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private sendTempData(timestamp: number, data: string): void {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        logger.debug(`messageId not sent in message since firmware implementation does not have it.`);

        const message = <DemopackMessage>{
            appId: TEMP,
            messageType: 'DATA',
            data
        };

        this.state.messages.sent++;

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending TEMP sensor data to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private async startApplication(pairing: Pairing): Promise<void> {
        if (pairing.state === 'paired') {
            if (pairing.topics && pairing.topics.d2c) {
                await this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);

                if (this.gps) {
                    await this.sendGeneric(GPS, 'HELLO', Date.now());
                    if (!this.gps.sensor.isStarted()) {
                        await this.gps.sensor.start();
                    }
                }

                if (this.flip) {
                    await this.sendGeneric(FLIP, 'HELLO', Date.now());
                    if (!this.flip.sensor.isStarted()) {
                        await this.flip.sensor.start();
                    }
                }

                if (this.temp) {
                    await this.sendGeneric(TEMP, 'HELLO', Date.now());
                    if (!this.temp.sensor.isStarted()) {
                        await this.temp.sensor.start();
                    }
                }

                this.applicationStarted = true;
                logger.info(`Pairing done, application started.`);
            } else {
                logger.warn('Paired but application topics are NOT provided by nRF Cloud.');
            }
        }
    }

    private async stopApplication(): Promise<void> {
        if (this.applicationStarted) {

            if (this.gps) {
                await this.gps.sensor.stop();
            }

            if (this.flip) {
                await this.flip.sensor.stop();
            }

            if (this.temp) {
                await this.temp.sensor.stop();
            }

            this.applicationStarted = false;
        }
    }

    private setupPairing() {
        this.pairingEngine.on('pairingUpdate', (state, status) => {
            logger.debug(`gpsFlip; updating shadow -> reported.pairing: ${JSON.stringify(state)} status: ${JSON.stringify(status)}`);
            this.hostConnection.updateShadow({
                pairing: state === null ? undefined : state,
                pairingStatus: status,
            });
        });

        this.hostConnection.on('shadowGetAccepted', async (shadow: ShadowModel) => {
            this.pairingEngine.updatePairingState(shadow.desired.pairing);

            if (shadow.desired.pairing && shadow.desired.pairing.state === 'paired') {
                await this.startApplication(shadow.desired.pairing);
            }
        });

        this.hostConnection.on('shadowDelta', async (delta: ShadowModelDesired) => {
            if (delta.pairing) {
                this.pairingEngine.updatePairingState(delta.pairing);

                if (delta.pairing.state === 'paired') {
                    await this.startApplication(delta.pairing);
                } else if (delta.pairing.state !== 'paired' && this.applicationStarted) {
                    await this.stopApplication();
                }
            } else {
                // Some application specific state is desired, reply back as reported and process afterwards
                logger.debug(`shadow; json data not related to pairing: ${JSON.stringify(delta)}`);
                await this.hostConnection.updateShadow(<ShadowModelReported>delta);
            }
        });
    }

    private static convertToInt8(data: Uint8Array): Int8Array {
        const dest = new Int8Array(data.length);

        data.forEach((value, idx) => {
            dest[idx] = value << 24 >> 24;
        });

        return dest;
    }

    async main(): Promise<number> {
        if (!this.sensors) {
            throw new FirmwareError('Sensors not provided. Required by GpsFlip.');
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
            this.gps = new Gps(gps);

            gps.on('data', (timestamp: number, data) => {
                if (Date.now() >= this.gps.lastGpsSend + GPS_SEND_INTERVAL) {
                    this.sendGpsData(timestamp, String.fromCharCode.apply(null, data));
                    this.gps.lastGpsSend = Date.now();
                }
            });
        }

        const acc = this.sensors.get('acc');

        if (acc) {
            this.flip = new Flip(acc);

            acc.on('data', (timestamp: number, data) => {
                const sample = Sample.fromArray(GpsFlip.convertToInt8(data));
                this.flip.update(timestamp, sample);
                if (this.flip.isChanged()) {
                    this.sendFlipData(timestamp, this.flip.orientation);
                }
            });
        }

        const temp = this.sensors.get('temp');

        if (temp) {
            this.temp = new Temp(temp);

            temp.on('data', (timestamp: number, data) => {
                this.sendTempData(timestamp, String.fromCharCode.apply(null, data));
            });
        }

        this.hostConnection.on('message', (message: any) => {
            const demopackMessage = <DemopackMessage>Object.assign({}, message);

            if (demopackMessage.appId === GPS) {
                logger.info(`Received GPS message ${JSON.stringify(demopackMessage)}. Discarding it.`);
            } else if (demopackMessage.appId === FLIP) {
                logger.info(`Received FLIP message ${JSON.stringify(demopackMessage)}. Discarding it.`);
            } else if (demopackMessage.appId === TEMP) {
                logger.info(`Received TEMP message ${JSON.stringify(demopackMessage)}. Discarding it.`);
            } else {
                logger.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
            }
        });

        await this.hostConnection.connect();

        return new Promise<number>(() => {
        });
    }
}
