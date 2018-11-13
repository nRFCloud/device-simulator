"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const os = require("os");
const path = require("path");
const defaultConfigurationFile = path.join(os.homedir(), '.nrfcloud', 'simulator_config.json');
exports.readConfiguration = (filename = defaultConfigurationFile) => {
    if (!fs.existsSync(filename)) {
        throw new Error(`Configuration file '${filename}' does not exist.`);
    }
    const configurationContent = fs.readFileSync(filename, { encoding: 'utf8' });
    return JSON.parse(configurationContent);
};
//# sourceMappingURL=Configuration.js.map