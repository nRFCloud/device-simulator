import { ISensor } from "../../sensors/Sensor";
import { SendMessage } from "../App";
import Service from "./Service";
export declare const createService: (name: string, sensor: ISensor, sendMessage: SendMessage) => Service;
