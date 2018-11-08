import { IHostConnection } from '../../src/connection/HostConnection';
import { FakeHostConnection, OnSendMessage, OnUpdateShadow } from '../../src/connection/FakeHostConnection';
import { DummyMethod } from '../../src/pairing/methods/DummyMethod';
import { PairingEngine } from '../../src/pairing/PairingEngine';
import { ISensor } from '../../src/sensors/Sensor';
import { FakeGps } from '../../src/sensors/FakeGps';
import { FirmwareDirectory } from '../../src/firmware/FirmwareDirectory';
import { ConfigurationData, MemoryConfigurationStorage } from '../../src/ConfigurationStorage';
import { ShadowModelReported } from '../../src/ShadowModel';
import { SwitchesMethod } from '../../src/pairing/methods/ButtonsMethod';
import { FakeAccelerometer } from '../../src/sensors/FakeAccelerometer';

let logger = require('winston');
let firmwareDirectory: FirmwareDirectory;

const nmeaRecording = '__tests__/sensors/nmea-recording.txt';
const accelerometerRecording = '__tests__/sensors/accelerometer-recording.txt';

describe('firmware directory', () => {
    beforeEach(async () => {
        const configurationStorage = new MemoryConfigurationStorage(<ConfigurationData>{});

        const pairingMethods = [new DummyMethod([1, 2, 3, 4, 5, 6]), new SwitchesMethod(4)];
        const pairingEngine = new PairingEngine(pairingMethods);

        const onUpdateShadow: OnUpdateShadow = async (updateShadow: ShadowModelReported) => {
            return;
        };

        const onSendMessage: OnSendMessage = async (message: string) => {
            return;
        };

        const hostConnection: IHostConnection = new FakeHostConnection(
            onUpdateShadow,
            onSendMessage,
            logger);

        const sensors: Map<string, ISensor> = new Map<string, ISensor>();
        sensors.set('gps', new FakeGps(nmeaRecording, ['GPGGA']));
        sensors.set('acc', new FakeAccelerometer(accelerometerRecording, false, 10));

        firmwareDirectory = new FirmwareDirectory(
            pairingEngine,
            hostConnection,
            sensors,
            logger
        );

        firmwareDirectory.create();
    });

    it('shall contain gps flip firmware and simulate it', async () => {
        const firmwareList = firmwareDirectory.getFirmwareList();

        expect(firmwareList).toBeDefined();

        expect(firmwareList.length).toBe(1);
        expect(firmwareList[0]).toBe('nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0');

        const firmware = firmwareDirectory.getFirmware('nsrn:devices:types/device/nordicsemi/nRF91/PCA10074/gpsFlipDemo/0');
        expect(firmware).toBeDefined();

        firmware.main();
    });
});
