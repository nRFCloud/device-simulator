"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const Pairing_1 = require("./Pairing");
class PairingEngine extends events_1.EventEmitter {
    constructor(pairingMethods) {
        super();
        this.pairingMethods = pairingMethods;
    }
    cancelRetrievePattern() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.pairingMethods && this.selectedPairingMethod) {
                const foundMethod = this.pairingMethods.find(method => method.methodName === this.selectedPairingMethod.methodName);
                if (!foundMethod) {
                    throw new Error(`Pairing method ${this.selectedPairingMethod.methodName} is not registered with the pairing engine.`);
                }
                else {
                    yield foundMethod.cancelRetrievePattern();
                }
            }
        });
    }
    stateWaitingForPattern(state) {
        if (this.pairingMethods) {
            const foundMethod = this.pairingMethods.find(method => {
                return method.methodName === state.config.method;
            });
            if (!foundMethod) {
                throw new Error(`Pairing method ${state.config.method} is not registered with the pairing engine.`);
            }
            else {
                this.selectedPairingMethod = foundMethod;
                foundMethod.retrievePattern(state.config.length).then(pattern => {
                    this.emit('pairingUpdate', null, {
                        pattern,
                        method: foundMethod.methodName
                    });
                }).catch(error => {
                    console.error(`Error retrieving pattern ${error}.`);
                });
            }
        }
        else {
            throw new Error('No pairing methods registered but pairing is requested.');
        }
    }
    stateFactory(pairing) {
        if (pairing == null) {
            return null;
        }
        switch (pairing.state) {
            case Pairing_1.State.STATE.initiate:
                return new Pairing_1.StateInitiate();
            case Pairing_1.State.STATE.patternWait:
                const config = pairing['config'];
                if (config == null) {
                    throw new Error(`Not config provided in shadow.`);
                }
                return new Pairing_1.StatePatternWait(new Pairing_1.PairingConfig(config.method, config.length, config.iteration));
            case Pairing_1.State.STATE.timeout:
                return new Pairing_1.StateTimeout();
            case Pairing_1.State.STATE.patternMismatch:
                return new Pairing_1.StatePatternMismatch();
            case Pairing_1.State.STATE.paired:
                const topics = pairing['topics'];
                return new Pairing_1.StatePaired(topics ? new Pairing_1.PairingTopics(topics.c2d, topics.d2c) : undefined);
            default:
                throw new Error(`Unknown state ${pairing.state} received`);
        }
    }
    emitShadowUpdate(pairing) {
        // Update shadow with differences
        const reportBack = Object.assign({}, pairing);
        if (this.previousPairing && pairing.state && this.previousPairing.state !== pairing.state) {
            Object.keys(this.previousPairing).forEach(key => {
                if (reportBack[key] == null) {
                    reportBack[key] = null;
                }
            });
        }
        this.emit('pairingUpdate', reportBack, null);
    }
    updatePairingState(pairing) {
        this.emitShadowUpdate(pairing);
        const previousState = this.stateFactory(this.previousPairing);
        // If shadow update does not contain any state, fetch is from previous state
        if (!pairing.state && previousState) {
            pairing.state = previousState.state;
        }
        const state = this.stateFactory(pairing);
        const localState = state.update(previousState);
        switch (localState.state) {
            case 'pattern_wait':
                this.stateWaitingForPattern(localState);
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
exports.PairingEngine = PairingEngine;
//# sourceMappingURL=PairingEngine.js.map