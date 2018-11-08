import { FirmwareError, FirmwareState, IFirmware, MessageStatus } from '../Firmware';
import { ConfigurationData } from '../../ConfigurationStorage';
import { IPairingEngine } from '../../pairing/PairingEngine';
import { IHostConnection } from '../../connection/HostConnection';
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../../ShadowModel';
import { ISensor } from '../../sensors/Sensor';
import { DemopackMessage } from './GpsFlipModel';
import { Pairing } from '../../pairing/Pairing';
import { App, createApp } from './App/App';

let logger = require('winston');

//
// Simulate behaviour of Alta device:
//   https://projecttools.nordicsemi.no/jira/browse/IS-1130
//

export type SendMessage = (timestamp: number, message: DemopackMessage) => void;

export class GpsFlip implements IFirmware {
    private config: ConfigurationData;
    private pairingEngine: IPairingEngine;
    private state: FirmwareState;
    private hostConnection: IHostConnection;
    private applicationStarted: boolean;
    private sensors: Map<string, ISensor>;
    private apps: App[] = [];

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

    private sendMessage: SendMessage = (timestamp, message) => {
        const timeStamp = new Date(timestamp).toISOString();
        logger.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        logger.debug(`messageId not sent in message since firmware implementation does not have it.`);

        this.state.messages.sent++;

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            logger.error(`Error sending sensor data to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private async startApplication(pairing: Pairing): Promise<void> {
        if (pairing.state === 'paired') {
            if (pairing.topics && pairing.topics.d2c) {
                await this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);

                for (const app of this.apps) {
                    await app.start();
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

            for (const app of this.apps) {
                await app.stop();
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

        this.apps = Array.from(this.sensors.entries()).map(([name, sensor]) => createApp(name, sensor, this.sendMessage));

        this.hostConnection.on('message', (message: any) => {
            const demopackMessage = <DemopackMessage>Object.assign({}, message);

            logger.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
        });

        await this.hostConnection.connect();

        return new Promise<number>(() => {
        });
    }
}
