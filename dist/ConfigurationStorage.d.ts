export interface ConfigurationData {
    platform: string;
    version: string;
    caCert: string;
    clientCert: string;
    privateKey: string;
    clientId: string;
    deviceType: string;
    brokerHostname: string;
    region: string;
    stage: string;
}
export interface IConfigurationStorage {
    getConfiguration(): Promise<ConfigurationData>;
    setConfiguration(configuration: ConfigurationData): Promise<void>;
}
export declare class FileConfigurationStorage implements IConfigurationStorage {
    readonly configFilename: string;
    constructor(configFilename: string);
    ensureConfigFileExists(): Promise<void>;
    getConfiguration(): Promise<ConfigurationData>;
    setConfiguration(configuration: ConfigurationData): Promise<void>;
}
export declare class MemoryConfigurationStorage implements IConfigurationStorage {
    private configuration;
    constructor(configuration: ConfigurationData);
    getConfiguration(): Promise<ConfigurationData>;
    setConfiguration(configuration: ConfigurationData): Promise<void>;
}
