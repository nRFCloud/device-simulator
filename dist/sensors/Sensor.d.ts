/// <reference types="node" />
import { EventEmitter } from 'events';
export interface ISensor extends EventEmitter {
    start(): Promise<void>;
    stop(): Promise<void>;
    isStarted(): boolean;
    on(event: 'data', listener: (timestamp: number, data: Uint8Array) => void): this;
    on(event: 'stopped', listener: (timestamp: number) => void): this;
}
