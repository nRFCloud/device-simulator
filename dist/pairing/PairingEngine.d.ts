/// <reference types="node" />
import { EventEmitter } from 'events';
import { IPairingMethod, State, PairingStatus, PairingTopics, Pairing } from './Pairing';
export interface IPairingEngine {
    updatePairingState(pairing: Pairing): void;
    on(event: 'pairingUpdate', listener: (state: State, status: PairingStatus) => void): this;
    on(event: 'paired', listener: (topics: PairingTopics) => void): this;
    on(event: 'patternRetrieved', listener: (pairingStatus: PairingStatus) => void): this;
}
export declare class PairingEngine extends EventEmitter implements IPairingEngine {
    readonly pairingMethods: Array<IPairingMethod>;
    private previousPairing;
    private selectedPairingMethod;
    constructor(pairingMethods: Array<IPairingMethod>);
    private cancelRetrievePattern();
    private stateWaitingForPattern(state);
    private stateFactory(pairing);
    private emitShadowUpdate(pairing);
    updatePairingState(pairing: Pairing): void;
}
