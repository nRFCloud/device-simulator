import { IPairingEngine } from '../pairing/PairingEngine';
import { IHostConnection } from '../connection/HostConnection';
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../ShadowModel';
import { ISensor } from '../sensors/Sensor';
import { AppMessage } from './AppModel';
import { Pairing } from '../pairing/Pairing';
import Service from './services/Service';
import { createService } from "./services/createService";

export type SendMessage = (timestamp: number, message: AppMessage) => void;

export default class App {
    private pairingEngine: IPairingEngine;
    private hostConnection: IHostConnection;
    private applicationStarted: boolean;
    private sensors: Map<string, ISensor>;
    private services: Service[] = [];
    private messagesSent = 0;

    constructor(
        pairingEngine: IPairingEngine,
        hostConnection: IHostConnection,
        sensors: Map<string, ISensor>) {
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.applicationStarted = false;
        this.sensors = sensors;
    }

    private sendMessage: SendMessage = (timestamp, message) => {
        const timeStamp = new Date(timestamp).toISOString();
        console.debug(`Timestamp in message #${this.messagesSent++}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        console.debug(`messageId not sent in message since firmware implementation does not have it.`);

        this.hostConnection.sendMessage(JSON.stringify(message)).catch(error => {
            console.error(`Error sending sensor data to nRF Cloud. Error is ${error.message}.`);
        });
    }

    private async startApplication(pairing: Pairing): Promise<void> {
        if (pairing.state === 'paired') {
            if (pairing.topics && pairing.topics.d2c) {
                await this.hostConnection.setTopics(pairing.topics.c2d, pairing.topics.d2c);

                for (const service of this.services) {
                    await service.start();
                }

                this.applicationStarted = true;
                console.info(`Pairing done, application started.`);
            } else {
                console.warn('Paired but application topics are NOT provided by nRF Cloud.');
            }
        }
    }

    private async stopApplication(): Promise<void> {
        if (this.applicationStarted) {
            for (const service of this.services) {
                await service.stop();
            }

            this.applicationStarted = false;
        }
    }

    private setupPairing() {
        this.pairingEngine.on('pairingUpdate', (state, status) => {
            console.debug(`updating shadow -> reported.pairing: ${JSON.stringify(state)} status: ${JSON.stringify(status)}`);
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
                console.debug(`shadow; json data not related to pairing: ${JSON.stringify(delta)}`);
                await this.hostConnection.updateShadow(<ShadowModelReported>delta);
            }
        });
    }

    async main() {
        if (!this.sensors) {
            throw new Error('Sensors not provided. Required by app.');
        }

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

        this.services = Array.from(this.sensors.entries()).map(([name, sensor]) => createService(name, sensor, this.sendMessage));

        this.hostConnection.on('message', (message: any) => {
            const demopackMessage = <AppMessage>Object.assign({}, message);

            console.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
        });

        await this.hostConnection.connect();
    }
}
