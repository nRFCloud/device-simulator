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
const os = require("os");
const path = require("path");
const fs = require("fs");
const program = require('commander');
const { red } = require('colors');
const ConfigurationStorage_1 = require("./ConfigurationStorage");
const PairingEngine_1 = require("./pairing/PairingEngine");
const DummyMethod_1 = require("./pairing/methods/DummyMethod");
const FirmwareDirectory_1 = require("./firmware/FirmwareDirectory");
const FakeGps_1 = require("./sensors/FakeGps");
const AWSIoTHostConnection_1 = require("./connection/AWSIoTHostConnection");
const ButtonsMethod_1 = require("./pairing/methods/ButtonsMethod");
const FakeAccelerometer_1 = require("./sensors/FakeAccelerometer");
const FakeThermometer_1 = require("./sensors/FakeThermometer");
const logger_1 = require("./logger");
let ran = false;
process.on('unhandledRejection', function (reason, p) {
    console.log('Possibly Unhandled Rejection at: Promise ', p, ' reason: ', reason);
});
function startSimulation(configFilename, firmwareNsrn, options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (configFilename == null) {
            configFilename = path.join(os.homedir(), '.nrfcloud', 'simulator_config.json');
        }
        const exists = yield new Promise((resolve) => fs.exists(path.resolve(configFilename), resolve));
        if (!exists) {
            throw `Configuration file '${configFilename}' not found.`;
        }
        const configurationStorage = new ConfigurationStorage_1.FileConfigurationStorage(configFilename);
        const config = yield configurationStorage.getConfiguration();
        const pairingMethods = [
            new DummyMethod_1.DummyMethod([1, 2, 3, 4, 5, 6]),
            new ButtonsMethod_1.SwitchesMethod(4)
        ];
        const pairingEngine = new PairingEngine_1.PairingEngine(pairingMethods);
        const hostConnection = new AWSIoTHostConnection_1.AWSIoTHostConnection(config, logger_1.default);
        const sensors = new Map();
        if (options && options.nmea) {
            sensors.set('gps', new FakeGps_1.FakeGps(options.nmea, ['GPGGA']));
        }
        if (options && options.acc) {
            sensors.set('acc', new FakeAccelerometer_1.FakeAccelerometer(options.acc, true, 1000));
        }
        if (options && options.temp) {
            sensors.set('temp', new FakeThermometer_1.default(options.temp, true, 2500));
        }
        const firmwareDirectory = new FirmwareDirectory_1.FirmwareDirectory(config, pairingEngine, hostConnection, sensors, logger_1.default);
        firmwareDirectory.create();
        const firmware = firmwareDirectory.getFirmware(firmwareNsrn);
        return firmware.main();
    });
}
program
    .command('start <firmware>')
    .option('-c, --config [config]', 'Configuration file containing credentials.')
    .option('-n, --nmea [nmea]', 'File containing NMEA sentences.')
    .option('-a, --acc [acc]', 'File containing accelerometer recordings.')
    .option('-t, --temp [temp]', 'File containing temperature recordings.')
    .action((cmd, env) => {
    ran = true;
    const { nmea, acc, temp } = env;
    startSimulation(env['config'], cmd, {
        nmea,
        acc,
        temp
    }).then(retval => {
        console.log(`Simulator stopped with return value ${retval}.`);
    }).catch(error => {
        process.stderr.write(`${red(error)}\n`);
    });
});
program.parse(process.argv);
if (!ran) {
    program.outputHelp();
    process.exit(1);
}
//# sourceMappingURL=cli.js.map