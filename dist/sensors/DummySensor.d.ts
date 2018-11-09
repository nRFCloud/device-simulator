/// <reference types="node" />
import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
export declare class DummySensor extends EventEmitter implements ISensor {
    private dummyData;
    private interval;
    private tick?;
    private started;
    constructor(dummyData: Uint8Array, interval: number);
    start(): Promise<void>;
    isStarted(): boolean;
    private cleanUp;
    stop(): Promise<void>;
}
