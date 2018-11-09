/// <reference types="node" />
import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
export declare class FakeGps extends EventEmitter implements ISensor {
    private readonly nmeaRecording;
    private readonly sentenceFilter;
    private readonly nmeaSeconds;
    private currentNmeaSecond?;
    private reader?;
    private readStream?;
    private nmeaTick?;
    private started;
    constructor(nmeaRecording: string, sentenceFilter: Array<string>);
    private setupNmeaReader;
    private nextNmeaTick;
    start(): Promise<void>;
    private cleanUp;
    stop(): void;
    isStarted(): boolean;
}
