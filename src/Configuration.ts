import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

export interface Configuration {
    caCert: string;
    clientCert: string;
    privateKey: string;
    clientId: string;
    brokerHostname: string;
    region: string;
}

const defaultConfigurationFile = path.join(os.homedir(), '.nrfcloud', 'simulator_config.json');

export const readConfiguration = (filename = defaultConfigurationFile): Configuration => {
    if (!fs.existsSync(filename)) {
        throw new Error(`Configuration file '${filename}' does not exist.`);
    }

    const configurationContent = fs.readFileSync(filename, {encoding: 'utf8'});
    return JSON.parse(configurationContent);
};
