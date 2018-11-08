import { IFirmware } from '../Firmware';
import { ConfigurationData } from '../../ConfigurationStorage';
import { IPairingEngine } from '../../pairing/PairingEngine';
import { IHostConnection } from '../../connection/HostConnection';
import { ISensor } from '../../sensors/Sensor';
export declare class GpsFlip implements IFirmware {
    private config;
    private pairingEngine;
    private state;
    private hostConnection;
    private applicationStarted;
    private sensors;
    private gps;
    private flip;
    private temp;
    constructor(config: ConfigurationData, pairingEngine: IPairingEngine, hostConnection: IHostConnection, sensors: Map<string, ISensor>, newLogger?: any);
    private sendGeneric(appId, messageType, timestamp);
    private sendGpsData(timestamp, data);
    private sendFlipData(timestamp, data);
    private sendTempData(timestamp, data);
    private startApplication(pairing);
    private stopApplication();
    private setupPairing();
    private static convertToInt8(data);
    main(): Promise<number>;
}
