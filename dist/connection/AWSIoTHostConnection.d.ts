/// <reference types="node" />
import { EventEmitter } from 'events';
import { IHostConnection } from './HostConnection';
import { ConfigurationData } from '../ConfigurationStorage';
import { ShadowModelReported } from '../ShadowModel';
export declare class AWSIoTHostConnection extends EventEmitter implements IHostConnection {
    private config;
    private mqtt;
    private d2c;
    private c2d;
    private deltaEnabled;
    constructor(config: ConfigurationData);
    private getShadowBaseTopic();
    updateShadow(reported: ShadowModelReported): Promise<void>;
    connect(): Promise<void>;
    private unsubscribeFromAll();
    disconnect(): Promise<void>;
    sendMessage(message: string): Promise<void>;
    setTopics(c2d: string, d2c: string): Promise<void>;
}
