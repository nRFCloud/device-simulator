import * as os from 'os';
import * as path from 'path';
import * as program from 'commander';
import { red } from 'colors';

import { FileConfigurationStorage } from './ConfigurationStorage';
import { PairingEngine } from './pairing/PairingEngine';
import { DummyMethod } from './pairing/methods/DummyMethod';
import { ISensor } from './sensors/Sensor';
import { FakeGps } from './sensors/FakeGps';
import { AWSIoTHostConnection } from './connection/AWSIoTHostConnection';
import { SwitchesMethod } from './pairing/methods/ButtonsMethod';
import { FakeAccelerometer } from './sensors/FakeAccelerometer';
import FakeThermometer from './sensors/FakeThermometer';
import App from './app/App';

process.on('unhandledRejection', function (reason, p) {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});

const pairingMethods = [
    new DummyMethod([1, 2, 3, 4, 5, 6]),
    new SwitchesMethod(4)
];

const sensors = (nmea: string, acc: string, temp: string) => {
    const sensors = new Map<string, ISensor>();

    if (nmea) { sensors.set('gps', new FakeGps(nmea, ['GPGGA'])); }
    if (acc) { sensors.set('acc', new FakeAccelerometer(acc, true, 1000)); }
    if (temp) { sensors.set('temp', new FakeThermometer(temp, true, 7000)); }

    return sensors;
};

const defaultConfig = path.join(os.homedir(), '.nrfcloud', 'simulator_config.json');

async function startSimulation({config = defaultConfig, nmea, acc, temp}: program.Command) {
    const configurationStorage = new FileConfigurationStorage(config);
    const configuration = await configurationStorage.getConfiguration();

    const app = new App(
        new PairingEngine(pairingMethods),
        new AWSIoTHostConnection(configuration),
        sensors(nmea, acc, temp));
    app.main();
}

program
    .option('-c, --config <config>', 'Configuration file containing credentials.')
    .option('-n, --nmea <nmea>', 'File containing NMEA sentences.')
    .option('-a, --acc <acc>', 'File containing accelerometer recordings.')
    .option('-t, --temp <temp>', 'File containing temperature recordings.')
    .parse(process.argv);

startSimulation(program).then(retval => {
    console.log(`Simulator stopped with return value ${retval}.`);
}).catch(error => {
    process.stderr.write(`${red(error)}\n`);
});
