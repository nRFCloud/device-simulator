import { IPairingMethod } from '../Pairing';

export class DummyMethod implements IPairingMethod {
    methodName: string;
    dummyPattern: Array<number>;

    async retrievePattern(): Promise<Array<number>> {
        return this.dummyPattern;
    }

    cancelRetrievePattern() { }

    constructor(dummyPattern: Array<number>) {
        this.methodName = 'dummy';
        this.dummyPattern = dummyPattern;
    }
}
