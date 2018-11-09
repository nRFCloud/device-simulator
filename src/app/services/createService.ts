import { ISensor } from "../../sensors/Sensor";
import { SendMessage } from "../App";
import Service from "./Service";
import Gps from "./Gps";
import Temp from "./Temp";
import Flip from "./Flip";

interface ServiceConstructors {
    [index: string]: new (sensor: ISensor, sendMessage: SendMessage) => Service;
}

const services: ServiceConstructors = {
    acc: Flip,
    gps: Gps,
    temp: Temp,
};

export const createService = (name: string, sensor: ISensor, sendMessage: SendMessage) =>
    new (services[name])(sensor, sendMessage);
