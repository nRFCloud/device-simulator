import { FirmwareError, IFirmware } from './Firmware';
import { GpsFlip } from './nordicsemi/GpsFlip';
import { IHostConnection } from '../connection/HostConnection';
import { IPairingEngine } from '../pairing/PairingEngine';
import { ISensor } from '../sensors/Sensor';

let logger = require('winston');

export class FirmwareDirectory {
    private firmware: Map<string, IFirmware>;
    private pairingEngine: IPairingEngine;
    private hostConnection: IHostConnection;
    private sensors: Map<string, ISensor>;

    constructor(pairingEngine: IPairingEngine,
                hostConnection: IHostConnection,
                sensors: Map<string, ISensor>,
                newLogger?: any) {
        this.pairingEngine = pairingEngine;
        this.hostConnection = hostConnection;
        this.sensors = sensors;
        this.firmware = new Map<string, IFirmware>();

        if (newLogger) {
            logger = newLogger;
        }
    }

    create() {
        this.firmware.set('nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0',
            new GpsFlip(
                this.pairingEngine,
                this.hostConnection,
                this.sensors,
                logger)
        );
    }

    getFirmwareList(): Array<string> {
        if (!this.firmware) {
            throw new FirmwareError(`No firmware registered with directory.`);
        }

        const keys = this.firmware.keys();
        const retval = [];

        for (let key of keys) {
            retval.push(key);
        }

        return retval;
    }

    getFirmware(firmware: string): IFirmware {
        if (!this.firmware) {
            throw new FirmwareError(`No firmware registered with directory.`);
        }

        if (!this.firmware.get(firmware)) {
            throw new FirmwareError(`Firmware with nsrn '${firmware}' does not exist.`);
        }

        return this.firmware.get(firmware);
    }
}
