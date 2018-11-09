import { IPairingEngine } from '../pairing/PairingEngine';
import { IHostConnection } from '../connection/HostConnection';
import { ISensor } from '../sensors/Sensor';
import { AppMessage } from './AppModel';
export declare type SendMessage = (timestamp: number, message: AppMessage) => void;
export default class App {
    private pairingEngine;
    private hostConnection;
    private applicationStarted;
    private sensors;
    private services;
    private messagesSent;
    constructor(pairingEngine: IPairingEngine, hostConnection: IHostConnection, sensors: Map<string, ISensor>);
    private sendMessage;
    private startApplication;
    private stopApplication;
    private setupPairing;
    main(): Promise<void>;
}
