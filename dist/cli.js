"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const program = require("commander");
const colors_1 = require("colors");
const Configuration_1 = require("./Configuration");
const PairingEngine_1 = require("./pairing/PairingEngine");
const DummyMethod_1 = require("./pairing/methods/DummyMethod");
const FakeGps_1 = require("./sensors/FakeGps");
const AWSIoTHostConnection_1 = require("./connection/AWSIoTHostConnection");
const ButtonsMethod_1 = require("./pairing/methods/ButtonsMethod");
const FakeAccelerometer_1 = require("./sensors/FakeAccelerometer");
const FakeThermometer_1 = require("./sensors/FakeThermometer");
const FakeDevice_1 = require("./sensors/FakeDevice");
const App_1 = require("./app/App");
process.on('unhandledRejection', function (reason, p) {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
const pairingMethods = [
    new DummyMethod_1.DummyMethod([1, 2, 3, 4, 5, 6]),
    new ButtonsMethod_1.SwitchesMethod(4)
];
const sensors = (nmea, acc, temp, device) => {
    const sensors = new Map();
    if (nmea) {
        sensors.set('gps', new FakeGps_1.FakeGps(nmea, ['GPGGA']));
    }
    if (acc) {
        sensors.set('acc', new FakeAccelerometer_1.FakeAccelerometer(acc, true, 1000));
    }
    if (temp) {
        sensors.set('temp', new FakeThermometer_1.default(temp, true, 7000));
    }
    if (device) {
        sensors.set('device', new FakeDevice_1.default(device, false, 1000));
    }
    return sensors;
};
function startSimulation({ config, nmea, acc, temp, device }) {
    return __awaiter(this, void 0, void 0, function* () {
        const configuration = Configuration_1.readConfiguration(config);
        const app = new App_1.default(new PairingEngine_1.PairingEngine(pairingMethods), new AWSIoTHostConnection_1.AWSIoTHostConnection(configuration), sensors(nmea, acc, temp, device));
        app.main();
    });
}
program
    .option('-c, --config <config>', 'Configuration file containing credentials.')
    .option('-n, --nmea <nmea>', 'File containing NMEA sentences.')
    .option('-a, --acc <acc>', 'File containing accelerometer recordings.')
    .option('-t, --temp <temp>', 'File containing temperature recordings.')
    .option('-d, --device <device>', 'File containing device info (band, mode, operator, battery, sim iccid, etc.).')
    .parse(process.argv);
startSimulation(program).catch(error => {
    process.stderr.write(`${colors_1.red(error)}\n`);
});
//# sourceMappingURL=cli.js.map