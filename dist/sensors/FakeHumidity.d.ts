/// <reference types="node" />
import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
export default class extends EventEmitter implements ISensor {
    private sensorRecording;
    private doLoop;
    private sampleRate;
    private samples;
    private doRun;
    constructor(sensorRecording: string, doLoop: boolean, sampleRate: number);
    private setupReader;
    private emitSamples;
    start(): Promise<void>;
    stop(): void;
    isStarted(): boolean;
}
