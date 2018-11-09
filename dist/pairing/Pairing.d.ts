export interface IPairingMethod {
    readonly methodName: string;
    retrievePattern(length: number): Promise<Array<number>>;
    cancelRetrievePattern(): Promise<void> | void;
}
export declare class Pairing {
    state?: string;
    [key: string]: any;
}
export declare class PairingConfig {
    readonly method: string;
    readonly length: number;
    readonly iteration?: number;
    constructor(method: string, length: number, iteration?: number);
}
export declare class PairingTopics {
    readonly c2d?: string;
    readonly d2c?: string;
    constructor(c2d?: string, d2c?: string);
}
export declare abstract class State {
    readonly state: string;
    constructor(state: string);
    abstract update(previous?: State): State;
    static STATE: {
        [index: string]: string;
    };
}
export declare class StateInitiate extends State {
    constructor();
    update(_: State): State;
    static copy(_: StateInitiate): StateInitiate;
}
export declare class StatePaired extends State {
    readonly topics?: PairingTopics;
    constructor(topics?: PairingTopics);
    update(previous: State): State;
    static copy(statePaired: StatePaired): StatePaired;
}
export declare class StatePatternWait extends State {
    readonly config: PairingConfig;
    constructor(config: PairingConfig);
    update(previous: State): State;
    static copy(statePatternWait: StatePatternWait): StatePatternWait;
}
export declare class StatePatternMismatch extends State {
    constructor();
    update(): State;
}
export declare class StateTimeout extends State {
    constructor();
    update(): State;
}
export declare class PairingStatus {
    readonly method: string;
    readonly pattern: Array<number>;
    constructor(method: string, pattern: Array<number>);
}
