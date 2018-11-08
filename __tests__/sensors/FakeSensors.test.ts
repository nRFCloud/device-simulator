import FakeThermometer from '../../src/sensors/FakeThermometer';
import { FakeGps } from '../../src/sensors/FakeGps';
import { ISensor } from '../../src/sensors/Sensor';
import { FakeAccelerometer } from '../../src/sensors/FakeAccelerometer';

const testFakeSensor = (sensorName: string, sensor: ISensor, expectedDataEvents: number) => {
    describe(sensorName, () => {
        it('shall be able to receive data from recording', async (done) => {
            const dataEvent = jest.fn();
            sensor.on('data', dataEvent);

            sensor.on('stopped', () => {
                expect(dataEvent).toHaveBeenCalledTimes(expectedDataEvents);
                done();
            });

            await sensor.start();
        });
    });
};

const thermometerRecording = '__tests__/sensors/thermometer-recording.txt';
testFakeSensor('fake thermometer', new FakeThermometer(thermometerRecording, false, 10), 13);

const nmeaRecording = '__tests__/sensors/nmea-recording.txt';
testFakeSensor('fake gps', new FakeGps(nmeaRecording, ['GPGGA', 'GPGLL']), 2);

const accelerometerRecording = '__tests__/sensors/accelerometer-recording.txt';
testFakeSensor('fake accelerometer', new FakeAccelerometer(accelerometerRecording, false, 10), 277);
