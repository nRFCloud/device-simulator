const t = require('tcomb');

const PairingStateType = t.refinement(
    t.String,
    (s: string) => s && (Object.keys(State.STATE).map(k => State.STATE[k]) as any).includes(s),
    'State');

const PositiveIntegerType = t.refinement(t.Integer, (n: number) => n && n > 0, 'PositiveIntegerType');
const NonEmptyStringType = t.refinement(t.String, (s: any) => s && s.length > 0, 'NonEmptyStringType');
const PatternArrayType = t.refinement(
    t.Array,
    (a: Array<number>) => a.find(value => {
        return value < 0 || value > 255;
    }) === 0);

export interface IPairingMethod {
    readonly methodName: string;

    retrievePattern(length: number): Promise<Array<number>>;

    cancelRetrievePattern(): Promise<void> | void;
}

export class Pairing {
    state?: string;
    [key: string]: any;
}

export class PairingConfig {
    readonly method: string;
    readonly length: number;
    readonly iteration?: number;

    constructor(method: string, length: number, iteration?: number) {
        this.method = t.maybe(NonEmptyStringType)(method);
        this.length = t.maybe(PositiveIntegerType)(length);
        this.iteration = t.maybe(PositiveIntegerType)(iteration);
    }
}

export class PairingTopics {
    readonly c2d?: string;
    readonly d2c?: string;

    constructor(c2d?: string, d2c?: string) {
        this.c2d = t.maybe(NonEmptyStringType)(c2d);
        this.d2c = t.maybe(NonEmptyStringType)(d2c);
    }
}

export abstract class State {
    readonly state: string;

    constructor(state: string) {
        this.state = PairingStateType(state, ['State()', 'state:state']);
    }

    abstract update(previous?: State): State;

    static STATE: {[index: string]: string} = {
        initiate: 'initiate',
        paired: 'paired',
        patternWait: 'pattern_wait',
        patternMismatch: 'pattern_mismatch',
        timeout: 'timeout'
    };
}

export class StateInitiate extends State {
    constructor() {
        super(State.STATE.initiate);
    }

    update(_: State): State {
        return StateInitiate.copy(this);
    }

    static copy(_: StateInitiate): StateInitiate {
        return new StateInitiate();
    }
}

export class StatePaired extends State {
    readonly topics?: PairingTopics;

    constructor(topics?: PairingTopics) {
        super(State.STATE.paired);
        this.topics = topics ? new PairingTopics(topics.c2d, topics.d2c) : undefined;
    }

    update(previous: State): State {
        if (previous && previous.state === State.STATE.paired && (previous instanceof StatePaired)) {
            return new StatePaired(previous.topics ?
                new PairingTopics(
                    this.topics && this.topics.c2d ? this.topics.c2d : previous.topics.c2d,
                    this.topics && this.topics.d2c ? this.topics.d2c : previous.topics.d2c
                ) : undefined);
        } else {
            return StatePaired.copy(this);
        }
    }

    static copy(statePaired: StatePaired): StatePaired {
        return new StatePaired(statePaired.topics ? new PairingTopics(statePaired.topics.c2d, statePaired.topics.d2c) : undefined);
    }
}

export class StatePatternWait extends State {
    readonly config: PairingConfig;

    constructor(config: PairingConfig) {
        super(State.STATE.patternWait);
        this.config = new PairingConfig(config.method, config.length, config.iteration);
    }

    update(previous: State): State {
        if (previous && previous.state === State.STATE.patternWait && (previous instanceof StatePatternWait)) {
            return new StatePatternWait(
                new PairingConfig(
                    this.config.method ? this.config.method : previous.config.method,
                    this.config.length ? this.config.length : previous.config.length,
                    this.config.iteration ? this.config.iteration : previous.config.iteration));
        } else {
            return StatePatternWait.copy(this);
        }
    }

    static copy(statePatternWait: StatePatternWait) {
        return new StatePatternWait(
            new PairingConfig(statePatternWait.config.method, statePatternWait.config.length, statePatternWait.config.iteration));
    }
}

export class StatePatternMismatch extends State {
    constructor() {
        super(State.STATE.patternMismatch);
    }

    update(): State {
        return new StatePatternMismatch();
    }
}

export class StateTimeout extends State {
    constructor() {
        super(State.STATE.timeout);
    }

    update(): State {
        return new StateTimeout();
    }
}

export class PairingStatus {
    readonly method: string;
    readonly pattern: Array<number>;

    constructor(method: string, pattern: Array<number>) {
        this.method = NonEmptyStringType(method);
        this.pattern = PatternArrayType(pattern);
    }
}
