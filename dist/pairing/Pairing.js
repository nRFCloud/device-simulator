"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const t = require('tcomb');
const PairingStateType = t.refinement(t.String, (s) => s && Object.keys(State.STATE).map(k => State.STATE[k]).includes(s), 'State');
const PositiveIntegerType = t.refinement(t.Integer, (n) => n && n > 0, 'PositiveIntegerType');
const NonEmptyStringType = t.refinement(t.String, (s) => s && s.length > 0, 'NonEmptyStringType');
const PatternArrayType = t.refinement(t.Array, (a) => a.find(value => {
    return value < 0 || value > 255;
}) === 0);
class Pairing {
}
exports.Pairing = Pairing;
class PairingConfig {
    constructor(method, length, iteration) {
        this.method = t.maybe(NonEmptyStringType)(method);
        this.length = t.maybe(PositiveIntegerType)(length);
        this.iteration = t.maybe(PositiveIntegerType)(iteration);
    }
}
exports.PairingConfig = PairingConfig;
class PairingTopics {
    constructor(c2d, d2c) {
        this.c2d = t.maybe(NonEmptyStringType)(c2d);
        this.d2c = t.maybe(NonEmptyStringType)(d2c);
    }
}
exports.PairingTopics = PairingTopics;
class State {
    constructor(state) {
        this.state = PairingStateType(state, ['State()', 'state:state']);
    }
}
State.STATE = {
    initiate: 'initiate',
    paired: 'paired',
    patternWait: 'pattern_wait',
    patternMismatch: 'pattern_mismatch',
    timeout: 'timeout'
};
exports.State = State;
class StateInitiate extends State {
    constructor() {
        super(State.STATE.initiate);
    }
    update(_) {
        return StateInitiate.copy(this);
    }
    static copy(_) {
        return new StateInitiate();
    }
}
exports.StateInitiate = StateInitiate;
class StatePaired extends State {
    constructor(topics) {
        super(State.STATE.paired);
        this.topics = topics ? new PairingTopics(topics.c2d, topics.d2c) : undefined;
    }
    update(previous) {
        if (previous && previous.state === State.STATE.paired && (previous instanceof StatePaired)) {
            return new StatePaired(previous.topics ?
                new PairingTopics(this.topics && this.topics.c2d ? this.topics.c2d : previous.topics.c2d, this.topics && this.topics.d2c ? this.topics.d2c : previous.topics.d2c) : undefined);
        }
        else {
            return StatePaired.copy(this);
        }
    }
    static copy(statePaired) {
        return new StatePaired(statePaired.topics ? new PairingTopics(statePaired.topics.c2d, statePaired.topics.d2c) : undefined);
    }
}
exports.StatePaired = StatePaired;
class StatePatternWait extends State {
    constructor(config) {
        super(State.STATE.patternWait);
        this.config = new PairingConfig(config.method, config.length, config.iteration);
    }
    update(previous) {
        if (previous && previous.state === State.STATE.patternWait && (previous instanceof StatePatternWait)) {
            return new StatePatternWait(new PairingConfig(this.config.method ? this.config.method : previous.config.method, this.config.length ? this.config.length : previous.config.length, this.config.iteration ? this.config.iteration : previous.config.iteration));
        }
        else {
            return StatePatternWait.copy(this);
        }
    }
    static copy(statePatternWait) {
        return new StatePatternWait(new PairingConfig(statePatternWait.config.method, statePatternWait.config.length, statePatternWait.config.iteration));
    }
}
exports.StatePatternWait = StatePatternWait;
class StatePatternMismatch extends State {
    constructor() {
        super(State.STATE.patternMismatch);
    }
    update() {
        return new StatePatternMismatch();
    }
}
exports.StatePatternMismatch = StatePatternMismatch;
class StateTimeout extends State {
    constructor() {
        super(State.STATE.timeout);
    }
    update() {
        return new StateTimeout();
    }
}
exports.StateTimeout = StateTimeout;
class PairingStatus {
    constructor(method, pattern) {
        this.method = NonEmptyStringType(method);
        this.pattern = PatternArrayType(pattern);
    }
}
exports.PairingStatus = PairingStatus;
//# sourceMappingURL=Pairing.js.map