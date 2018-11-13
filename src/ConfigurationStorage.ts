import * as fs from 'fs';

export interface ConfigurationData {
    caCert: string;
    clientCert: string;
    privateKey: string;
    clientId: string;
    brokerHostname: string;
    region: string;
}

export interface IConfigurationStorage {
    getConfiguration(): ConfigurationData;
    setConfiguration(configuration: ConfigurationData): Promise<void>;
}

export class FileConfigurationStorage implements IConfigurationStorage {
    constructor(readonly configFilename: string) { }

    async ensureConfigFileExists() {
        if (!fs.existsSync(this.configFilename)) {
            const fd = (await new Promise((resolve) => fs.open(this.configFilename, 'w', resolve))) as number;
            await new Promise((resolve) => fs.write(fd, '{}', resolve));
            await new Promise((resolve) => fs.close(fd, resolve));
        }
    }

    getConfiguration(): ConfigurationData {
        if (!fs.existsSync(this.configFilename)) {
            throw new Error(`Configuration file '${this.configFilename}' does not exist.`);
        }

        const config = fs.readFileSync(this.configFilename, {encoding: 'utf8'});
        return JSON.parse(config);
    }

    async setConfiguration(configuration: ConfigurationData): Promise<void> {
        await this.ensureConfigFileExists();
        await new Promise(resolve => fs.writeFile(this.configFilename, JSON.stringify(configuration), 'utf8', resolve));
    }
}

export class MemoryConfigurationStorage implements IConfigurationStorage {
    private configuration: ConfigurationData;

    constructor(configuration: ConfigurationData) {
        this.configuration = configuration;
    }

    getConfiguration(): ConfigurationData {
        return this.configuration;
    }

    async setConfiguration(configuration: ConfigurationData): Promise<void> {
        this.configuration = configuration;
    }
}
