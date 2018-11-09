/// <reference types="node" />
import { ShadowModel, ShadowModelDesired, ShadowModelReported } from '../ShadowModel';
import { EventEmitter } from 'events';
export declare class HostConnectionError extends Error {
    constructor(message: string);
}
export interface IHostConnection extends EventEmitter {
    connect(): Promise<void> | void;
    disconnect(): Promise<void> | void;
    updateShadow(reported: ShadowModelReported): Promise<void>;
    sendMessage(message: any): Promise<void>;
    setTopics(c2d: string, d2c: string): Promise<void>;
    on(event: 'disconnect', handler: () => void): this;
    on(event: 'connect', handler: () => void): this;
    on(event: 'reconnect', handler: () => void): this;
    on(event: 'shadowGetAccepted', handler: (shadow: ShadowModel) => void): this;
    on(event: 'shadowDelta', handler: (shadow: ShadowModelDesired) => void): this;
    on(event: 'message', handler: (message: string) => void): this;
}
