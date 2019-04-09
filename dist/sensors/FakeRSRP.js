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
const fs = require("fs");
const readline = require("readline");
class default_1 extends events_1.EventEmitter {
    constructor(sensorRecording, doLoop, sampleRate) {
        super();
        this.sensorRecording = sensorRecording;
        this.doLoop = doLoop;
        this.sampleRate = sampleRate;
        this.samples = [];
        this.doRun = false;
    }
    setupReader() {
        const input = fs.createReadStream(this.sensorRecording);
        const reader = readline.createInterface({ input });
        reader.on('line', line => {
            this.samples.push(line);
        });
        reader.on('close', () => {
            if (reader) {
                reader.close();
            }
            if (input) {
                input.close();
            }
            // Start sending data
            this.emitSamples();
        });
    }
    emitSamples() {
        return __awaiter(this, void 0, void 0, function* () {
            do {
                for (const sample of this.samples) {
                    if (!this.doRun) {
                        return;
                    }
                    this.emit('data', Date.now(), new Uint8Array(Buffer.from(sample)));
                    yield new Promise(resolve => {
                        setTimeout(() => resolve(), this.sampleRate);
                    });
                }
            } while (this.doRun && this.doLoop);
            this.emit('stopped');
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(this.sensorRecording)) {
                throw `Sensor recording with filename '${this.sensorRecording}' does not exist.`;
            }
            this.doRun = true;
            this.setupReader();
        });
    }
    stop() {
        this.doRun = false;
    }
    isStarted() {
        return this.doRun;
    }
}
exports.default = default_1;
//# sourceMappingURL=FakeRSRP.js.map