import { ISensor } from '../../../sensors/Sensor';
import { DemopackMessage } from '../GpsFlipModel';
import { App } from './App';
import { SendMessage } from '../GpsFlip';

const APPID = 'TEMP';

export default class implements App {
    constructor(private readonly sensor: ISensor, private readonly sendMessage: SendMessage) { }

    async start() {
        await this.sendHello();

        this.sensor.on('data', (timestamp: number, data) => {
            const message = <DemopackMessage>{
                appId: APPID,
                messageType: 'DATA',
                data: String.fromCharCode.apply(null, data)
            };
            this.sendMessage(timestamp, message);
        });

        if (!this.sensor.isStarted()) {
            await this.sensor.start();
        }
    }

    private async sendHello() {
        await this.sendMessage(Date.now(), {
            appId: APPID,
            messageType: 'HELLO',
        });
    }

    async stop() {
        await this.sensor.stop();
    }
}