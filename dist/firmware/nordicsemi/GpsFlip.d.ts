import { IFirmware } from '../Firmware';
import { ConfigurationData } from '../../ConfigurationStorage';
import { IPairingEngine } from '../../pairing/PairingEngine';
import { IHostConnection } from '../../connection/HostConnection';
import { ISensor } from '../../sensors/Sensor';
import { DemopackMessage } from './GpsFlipModel';
export declare type SendMessage = (timestamp: number, message: DemopackMessage) => void;
export declare class GpsFlip implements IFirmware {
    private config;
    private pairingEngine;
    private state;
    private hostConnection;
    private applicationStarted;
    private sensors;
    private apps;
    constructor(config: ConfigurationData, pairingEngine: IPairingEngine, hostConnection: IHostConnection, sensors: Map<string, ISensor>, newLogger?: any);
    private sendMessage;
    private startApplication(pairing);
    private stopApplication();
    private setupPairing();
    main(): Promise<number>;
}
