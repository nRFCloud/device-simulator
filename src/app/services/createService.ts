import { ISensor } from "../../sensors/Sensor";
import { SendMessage } from "../App";
import Service from "./Service";
import Gps from "./Gps";
import Temp from "./Temp";
import Flip from "./Flip";
import RSRP from "./RSRP";

interface ServiceConstructors {
    [index: string]: new (sensor: ISensor, sendMessage: SendMessage) => Service;
}

const services: ServiceConstructors = {
    acc: Flip,
    gps: Gps,
    temp: Temp,
    rsrp: RSRP,
};

export const createService = (name: string, sensor: ISensor, sendMessage: SendMessage) => {
    const Service = services[name];
    if (Service == null) {
        throw new Error(`No service for a sensor named '${name}' is known.`);
    }

    return new Service(sensor, sendMessage);
};

