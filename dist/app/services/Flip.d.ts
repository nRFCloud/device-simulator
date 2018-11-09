import { ISensor } from '../../sensors/Sensor';
import { SendMessage } from '../App';
import Service from './Service';
export default class implements Service {
    private readonly sensor;
    private readonly sendMessage;
    private currentOrientation;
    private orientationChange;
    constructor(sensor: ISensor, sendMessage: SendMessage);
    start(): Promise<void>;
    private sendHello;
    stop(): Promise<void>;
    readonly orientation: string;
    private updateOrientation;
}
