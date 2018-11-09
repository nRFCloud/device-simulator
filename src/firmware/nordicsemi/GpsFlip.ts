import { FirmwareError, FirmwareState, IFirmware, MessageStatus } from '../Firmware';
import { IPairingEngine } from '../../pairing/PairingEngine';
import { IHostConnection } from '../../connection/HostConnection';
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../../ShadowModel';
import { ISensor } from '../../sensors/Sensor';
import { DemopackMessage } from './GpsFlipModel';
import { Pairing } from '../../pairing/Pairing';
import Service from './services/Service';
import { createService } from "./services/createService";

//
// Simulate behaviour of Alta device:
//   https://projecttools.nordicsemi.no/jira/browse/IS-1130
//

export type SendMessage = (timestamp: number, message: DemopackMessage) => void;

export class GpsFlip implements IFirmware {
    private pairingEngine: IPairingEngine;
    private state: FirmwareState;
    private hostConnection: IHostConnection;
    private applicationStarted: boolean;
    private sensors: Map<string, ISensor>;
    private services: Service[] = [];

    constructor(
        pairingEngine: IPairingEngine,
        hostConnection: IHostConnection,
        sensors: Map<string, ISensor>) {
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
        this.applicationStarted = false;
        this.sensors = sensors;
    }

    private sendMessage: SendMessage = (timestamp, message) => {
        const timeStamp = new Date(timestamp).toISOString();
        console.debug(`Timestamp in message #${this.state.messages.sent}, ${timeStamp} removed from message, since firmware implementation does not support it yet.`);
        console.debug(`messageId not sent in message since firmware implementation does not have it.`);

        this.state.messages.sent++;

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
            console.debug(`gpsFlip; updating shadow -> reported.pairing: ${JSON.stringify(state)} status: ${JSON.stringify(status)}`);
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

    async main(): Promise<number> {
        if (!this.sensors) {
            throw new FirmwareError('Sensors not provided. Required by GpsFlip.');
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
            const demopackMessage = <DemopackMessage>Object.assign({}, message);

            console.info(`Received message (ignoring it) ${JSON.stringify(demopackMessage)}`);
        });

        await this.hostConnection.connect();

        return new Promise<number>(() => {
        });
    }
}
