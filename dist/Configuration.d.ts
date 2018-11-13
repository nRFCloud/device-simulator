export interface Configuration {
    caCert: string;
    clientCert: string;
    privateKey: string;
    clientId: string;
    brokerHostname: string;
    region: string;
}
export declare const readConfiguration: (filename?: string) => Configuration;
