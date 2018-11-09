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
class WaitDuration {
    constructor(duration) {
        this._duration = duration;
    }
    get duration() {
        return this._duration;
    }
}
class Sample {
    constructor(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }
    get X() {
        return this.x;
    }
    get Y() {
        return this.y;
    }
    get Z() {
        return this.z;
    }
    toArray() {
        return [this.X, this.Y, this.Z];
    }
    static fromArray(from) {
        return new Sample(from[0], from[1], from[2]);
    }
}
exports.Sample = Sample;
class FakeAccelerometer extends events_1.EventEmitter {
    constructor(flipRecording, doLoop = true, defaultSampleRate = 1000) {
        super();
        this.defaultSampleRate = defaultSampleRate;
        this.movementSensorRecording = flipRecording;
        this.samples = new Set();
        this.doLoop = doLoop;
        this.doRun = false;
    }
    static parseSample(sample) {
        const columns = sample.split(',');
        return new Sample(parseInt(columns[0]), parseInt(columns[1]), parseInt(columns[2]));
    }
    setupReader() {
        this.readStream = fs.createReadStream(this.movementSensorRecording);
        this.reader = readline.createInterface({
            input: this.readStream
        });
        this.reader.on('line', line => {
            const columns = line.split(',');
            if (columns.length === 3) {
                // 3-axis accelerometer data
                this.samples = this.samples.add(FakeAccelerometer.parseSample(line));
            }
            else if (columns.length === 1) {
                // Wait time
                this.samples = this.samples.add(new WaitDuration(parseInt(columns[0])));
            }
            else {
                console.log(`Unknown sample received: '${line}'.`);
            }
        });
        this.reader.on('close', () => {
            if (this.reader) {
                this.reader.close();
            }
            if (this.readStream) {
                this.readStream.close();
            }
            // Start sending data
            this.emitSamples();
        });
    }
    emitSamples() {
        return __awaiter(this, void 0, void 0, function* () {
            do {
                const it = this.samples.entries();
                let done = false;
                while (!done) {
                    const next = it.next();
                    if (!next.done && this.doRun) {
                        const entry = next.value[0];
                        if (entry instanceof Sample) {
                            this.emit('data', Date.now(), entry.toArray());
                            yield new Promise(resolve => {
                                setTimeout(() => resolve(), this.defaultSampleRate);
                            });
                        }
                        else if (entry instanceof WaitDuration) {
                            yield new Promise(resolve => {
                                setTimeout(() => resolve(), entry.duration);
                            });
                        }
                    }
                    else {
                        done = true;
                    }
                }
            } while (this.doRun && this.doLoop);
            this.emit('stopped');
        });
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            this.doRun = true;
            const fileExists = yield new Promise((resolve) => fs.exists(this.movementSensorRecording, resolve));
            if (!fileExists) {
                throw `Movement sensor recording with filename '${this.movementSensorRecording}' does not exist.`;
            }
            this.setupReader();
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.doRun = false;
        });
    }
    isStarted() {
        return this.doRun;
    }
}
exports.FakeAccelerometer = FakeAccelerometer;
//# sourceMappingURL=FakeAccelerometer.js.map