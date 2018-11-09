import { ISensor } from "../../../sensors/Sensor";
import { SendMessage } from "../GpsFlip";
import Gps from "./Gps";
import Temp from "./Temp";
import Flip from "./Flip";

const services = {
    acc: Flip,
    gps: Gps,
    temp: Temp,
};

export const createService = (name: string, sensor: ISensor, sendMessage: SendMessage) =>
    new (services[name])(sensor, sendMessage);
