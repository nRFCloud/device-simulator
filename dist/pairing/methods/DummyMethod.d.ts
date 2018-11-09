import { IPairingMethod } from '../Pairing';
export declare class DummyMethod implements IPairingMethod {
    methodName: string;
    dummyPattern: Array<number>;
    retrievePattern(): Promise<Array<number>>;
    cancelRetrievePattern(): void;
    constructor(dummyPattern: Array<number>);
}
