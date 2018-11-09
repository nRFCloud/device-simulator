/// <reference types="node" />
import { IHostConnection } from './HostConnection';
import { ShadowModelReported } from '../ShadowModel';
import { EventEmitter } from 'events';
export declare class FakeHostConnection extends EventEmitter implements IHostConnection {
    connect(): void;
    disconnect(): void;
    injectMessageToDevice(message: string): void;
    updateShadow(_reported: ShadowModelReported): Promise<void>;
    sendMessage(_message: string): Promise<void>;
    setTopics(_c2d: string, _d2c: string): Promise<void>;
}
