import { EventEmitter } from 'events';
import {
    IPairingMethod, State, PairingStatus, PairingTopics, StateInitiate, StatePatternWait,
    Pairing, PairingConfig, StateTimeout, StatePatternMismatch, StatePaired
} from './Pairing';
const logger = require('winston');

export interface IPairingEngine {
    updatePairingState(pairing: Pairing): void;

    on(event: 'pairingUpdate', listener: (state: State, status: PairingStatus) => void): this;

    on(event: 'paired', listener: (topics: PairingTopics) => void): this;

    on(event: 'patternRetrieved', listener: (pairingStatus: PairingStatus) => void): this;
}

export class PairingEngine extends EventEmitter implements IPairingEngine {
    readonly pairingMethods: Array<IPairingMethod>;
    private previousPairing: Pairing;
    private selectedPairingMethod: IPairingMethod;

    constructor(pairingMethods: Array<IPairingMethod>) {
        super();
        this.pairingMethods = pairingMethods;
    }

    private async cancelRetrievePattern(): Promise<void> {
        if (this.pairingMethods && this.selectedPairingMethod) {
            const foundMethod = this.pairingMethods.find(method => {
                return method.methodName === this.selectedPairingMethod.methodName;
            });

            if (!foundMethod) {
                throw new Error(`Pairing method ${this.selectedPairingMethod.methodName} is not registered with the pairing engine.`);
            } else {
                await foundMethod.cancelRetrievePattern();
            }
        }
    }

    private stateWaitingForPattern(state: StatePatternWait) {
        if (this.pairingMethods) {
            const foundMethod = this.pairingMethods.find(method => {
                return method.methodName === state.config.method;
            });

            if (!foundMethod) {
                throw new Error(`Pairing method ${state.config.method} is not registered with the pairing engine.`);
            } else {
                this.selectedPairingMethod = foundMethod;

                foundMethod.retrievePattern(state.config.length).then(pattern => {
                    this.emit('pairingUpdate', null, <PairingStatus>{
                        pattern,
                        method: foundMethod.methodName
                    });
                }).catch(error => {
                    logger.error(`Error retrieving pattern ${error}.`);
                });
            }
        } else {
            throw new Error('No pairing methods registered but pairing is requested.');
        }
    }

    private stateFactory(pairing: Pairing): State | null {
        if (pairing == null) {
            return null;
        }

        switch (pairing.state) {
            case State.STATE.initiate:
                return new StateInitiate();
            case State.STATE.patternWait:
                const config = pairing['config'];

                if (config == null) {
                    throw new Error(`Not config provided in shadow.`);
                }

                return new StatePatternWait(new PairingConfig(
                    config.method,
                    config.length,
                    config.iteration
                ));
            case State.STATE.timeout:
                return new StateTimeout();
            case State.STATE.patternMismatch:
                return new StatePatternMismatch();
            case State.STATE.paired:
                const topics = pairing['topics'];
                return new StatePaired(topics ? new PairingTopics(topics.c2d, topics.d2c) : undefined);
            default:
                throw new Error(`Unknown state ${pairing.state} received`);
        }
    }

    private emitShadowUpdate(pairing: Pairing) {
        // Update shadow with differences
        const reportBack: any = {...pairing};

        if (this.previousPairing && pairing.state && this.previousPairing.state !== pairing.state) {
            Object.keys(this.previousPairing).forEach(key => {
                if (reportBack[key] == null) {
                    reportBack[key] = null;
                }
            });
        }

        this.emit('pairingUpdate', reportBack, null);
    }

    updatePairingState(pairing: Pairing) {
        this.emitShadowUpdate(pairing);

        const previousState = this.stateFactory(this.previousPairing);

        // If shadow update does not contain any state, fetch is from previous state
        if (!pairing.state && previousState) {
            pairing.state = previousState.state;
        }

        const state = this.stateFactory(pairing);

        if (previousState) {
            logger.debug(`STATE: ${previousState.state} -> ${state.state}`);
        }

        const localState = state.update(previousState);

        switch (localState.state) {
            case 'pattern_wait':
                this.stateWaitingForPattern(localState as StatePatternWait);
                break;
            case 'paired':
                this.emit('paired');
                break;
            case 'timeout':
            case 'pattern_mismatch':
                this.cancelRetrievePattern();
                break;
        }

        this.previousPairing = localState;
    }
}
