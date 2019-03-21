import { ISensor } from '../../sensors/Sensor';
import { AppMessage } from '../AppModel';
import { SendMessage } from '../App';
import Service from './Service';

const APPID = 'HUMID';

export default class implements Service {
    constructor(private readonly sensor: ISensor, private readonly sendMessage: SendMessage) { }

    async start() {
        await this.sendHello();

        this.sensor.on('data', (timestamp: number, data) => {
            const message = <AppMessage>{
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
