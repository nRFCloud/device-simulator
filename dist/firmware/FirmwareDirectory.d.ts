import { IFirmware } from './Firmware';
import { IHostConnection } from '../connection/HostConnection';
import { IPairingEngine } from '../pairing/PairingEngine';
import { ISensor } from '../sensors/Sensor';
export declare class FirmwareDirectory {
    private firmware;
    private pairingEngine;
    private hostConnection;
    private sensors;
    constructor(pairingEngine: IPairingEngine, hostConnection: IHostConnection, sensors: Map<string, ISensor>);
    create(): void;
    getFirmwareList(): Array<string>;
    getFirmware(firmware: string): IFirmware;
}
