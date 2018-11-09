/// <reference types="node" />
import { IPairingMethod } from '../Pairing';
export declare class SwitchesMethod implements IPairingMethod {
    private readonly numberOfButtons;
    methodName: string;
    rejectRetrievePattern: any;
    constructor(numberOfButtons: number);
    addKeypress(key: string, pattern: Buffer, idx: number): void;
    retrievePattern(patternLength: number): Promise<Array<number>>;
    cancelRetrievePattern(): Promise<void>;
}
