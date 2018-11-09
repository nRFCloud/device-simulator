import { IPairingMethod } from '../Pairing';
import * as readline from 'readline';

const setTerminalToRawMode = (mode: boolean) => {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode!(mode);
    }
};

const startReadingKeypresses = (keyPressListener: (str: string) => void) => {
    setTerminalToRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', keyPressListener);
};

const stopReadingKeypresses = () => {
    process.stdin.pause();
    setTerminalToRawMode(false);
    process.stdin.removeAllListeners('keypress');
};

export class SwitchesMethod implements IPairingMethod {
    methodName = 'buttons';
    rejectRetrievePattern: any;

    constructor(private readonly numberOfButtons: number) {
    }

    addKeypress(key: string, pattern: Buffer, idx: number) {
        const keyId = key.charCodeAt(0) - '0'.charCodeAt(0);
        if (!(keyId > 0 && keyId <= this.numberOfButtons)) {
            return;
        }

        const pos = Math.floor(idx / 2);
        const prev = pattern.readUInt8(pos);
        const value = keyId | (prev << ((idx % 2) * 4));

        pattern.writeUInt8(value, pos);
    }

    retrievePattern(patternLength: number): Promise<Array<number>> {
        patternLength = patternLength;
        console.log(`Press buttons 1-${this.numberOfButtons} ${patternLength} times.`);

        return new Promise<Array<number>>(resolve => {
            readline.emitKeypressEvents(process.stdin);

            let idx = 0;
            const pattern = Buffer.alloc(patternLength / 2 + (patternLength % 2));

            startReadingKeypresses((key: string) => {
                this.addKeypress(key, pattern, idx);
                idx++;

                if (idx >= patternLength) {
                    console.log(`Pattern recorded. Pattern is (hex): ${pattern.toString('hex')}`);
                    this.rejectRetrievePattern = null;

                    stopReadingKeypresses();
                    resolve(<Array<number>>Array.prototype.slice.call(pattern, 0));
                }
            });
        });
    }

    async cancelRetrievePattern(): Promise<void> {
        if (this.rejectRetrievePattern) {
            this.rejectRetrievePattern('Canceled retrieval of pattern');
        }

        stopReadingKeypresses();
    }
}
