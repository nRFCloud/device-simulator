import { ISensor } from "../../../sensors/Sensor";
import { SendMessage } from "../GpsFlip";
import Gps from "./Gps";
import Temp from "./Temp";
import Flip from "./Flip";

const apps = {
    acc: Flip,
    gps: Gps,
    temp: Temp,
};

export const createApp = (name: string, sensor: ISensor, sendMessage: SendMessage) => new (apps[name])(sensor, sendMessage);

export interface App {
    start();
    stop();
}
