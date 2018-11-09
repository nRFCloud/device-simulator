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
const readline = require("readline");
const setTerminalToRawMode = (mode) => {
    if (process.stdin.isTTY) {
        process.stdin.setRawMode(mode);
    }
};
const startReadingKeypresses = (keyPressListener) => {
    setTerminalToRawMode(true);
    process.stdin.resume();
    process.stdin.on('keypress', keyPressListener);
};
const stopReadingKeypresses = () => {
    process.stdin.pause();
    setTerminalToRawMode(false);
    process.stdin.removeAllListeners('keypress');
};
class SwitchesMethod {
    constructor(numberOfButtons) {
        this.numberOfButtons = numberOfButtons;
        this.methodName = 'buttons';
    }
    addKeypress(key, pattern, idx) {
        const keyId = key.charCodeAt(0) - '0'.charCodeAt(0);
        if (!(keyId > 0 && keyId <= this.numberOfButtons)) {
            return;
        }
        const pos = Math.floor(idx / 2);
        const prev = pattern.readUInt8(pos);
        const value = keyId | (prev << ((idx % 2) * 4));
        pattern.writeUInt8(value, pos);
    }
    retrievePattern(patternLength) {
        patternLength = patternLength;
        console.log(`Press buttons 1-${this.numberOfButtons} ${patternLength} times.`);
        return new Promise(resolve => {
            readline.emitKeypressEvents(process.stdin);
            let idx = 0;
            const pattern = Buffer.alloc(patternLength / 2 + (patternLength % 2));
            startReadingKeypresses((key) => {
                this.addKeypress(key, pattern, idx);
                idx++;
                if (idx >= patternLength) {
                    console.log(`Pattern recorded. Pattern is (hex): ${pattern.toString('hex')}`);
                    this.rejectRetrievePattern = null;
                    stopReadingKeypresses();
                    resolve(Array.prototype.slice.call(pattern, 0));
                }
            });
        });
    }
    cancelRetrievePattern() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.rejectRetrievePattern) {
                this.rejectRetrievePattern('Canceled retrieval of pattern');
            }
            stopReadingKeypresses();
        });
    }
}
exports.SwitchesMethod = SwitchesMethod;
//# sourceMappingURL=ButtonsMethod.js.map