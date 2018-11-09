/// <reference types="node" />
import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
export declare class Sample {
    private x;
    private y;
    private z;
    constructor(x: number, y: number, z: number);
    readonly X: number;
    readonly Y: number;
    readonly Z: number;
    toArray(): Array<number>;
    static fromArray(from: Int8Array): Sample;
}
export declare class FakeAccelerometer extends EventEmitter implements ISensor {
    private movementSensorRecording;
    private defaultSampleRate;
    private reader?;
    private readStream?;
    private samples;
    private doLoop;
    private doRun;
    constructor(flipRecording: string, doLoop?: boolean, defaultSampleRate?: number);
    private static parseSample;
    private setupReader;
    private emitSamples;
    start(): Promise<void>;
    stop(): Promise<void>;
    isStarted(): boolean;
}
