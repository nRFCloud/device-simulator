import { ISensor } from '../../../sensors/Sensor';
import { DemopackMessage } from '../GpsFlipModel';
import { Sample } from '../../../sensors/FakeAccelerometer';
import { SendMessage } from '../GpsFlip';
import Service from './Service';

const APPID = 'FLIP';

enum Orientation {
    NORMAL,
    UPSIDE_DOWN,
}

const convertToInt8 = (data: Uint8Array): Int8Array => {
    const dest = new Int8Array(data.length);

    data.forEach((value, idx) => {
        dest[idx] = value << 24 >> 24;
    });

    return dest;
};

export default class implements Service {
    private currentOrientation = Orientation.NORMAL;
    private orientationChange: boolean;

    constructor(private readonly sensor: ISensor, private readonly sendMessage: SendMessage) { }

    async start() {
        await this.sendHello();

        this.sensor.on('data', (timestamp: number, data) => {
            const sample = Sample.fromArray(convertToInt8(data));
            this.updateOrientation(sample);
            if (this.isChanged()) {
                const message = <DemopackMessage>{
                    appId: APPID,
                    messageType: 'DATA',
                    data: this.orientation
                };
                this.sendMessage(timestamp, message);
            }
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

    get orientation(): string {
        switch (this.currentOrientation) {
            case Orientation.NORMAL:
                return 'NORMAL';
            case Orientation.UPSIDE_DOWN:
                return 'UPSIDE_DOWN';
            default:
                console.error(`Unknown orientation`);
                return '';
        }
    }

    private updateOrientation(sample: Sample) {
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
            this.orientationChange = true;
        }
    }

    isChanged(): boolean {
        const retval = this.orientationChange;
        this.orientationChange = false;
        return retval;
    }
}
