import FakeThermometer from '../../src/sensors/FakeThermometer';
import { ISensor } from '../../src/sensors/Sensor';

let thermometer: ISensor;

const thermometerRecording = '__tests__/sensors/thermometer-recording.txt';

let dataMock: any;

describe('fake thermometer', () => {
    beforeEach(() => {
        thermometer = new FakeThermometer(thermometerRecording, false, 10);

        dataMock = jest.fn();
        thermometer.on('data', dataMock);
    });

    it('shall be able to receive data from thermometer recording', async done => {
        thermometer.on('stopped', () => {
            expect(dataMock).toHaveBeenCalledTimes(13);
            done();
        });

        await thermometer.start();
    });
});
