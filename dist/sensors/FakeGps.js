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
class FakeGps extends events_1.EventEmitter {
    constructor(nmeaRecording, sentenceFilter) {
        super();
        this.nmeaRecording = nmeaRecording;
        this.sentenceFilter = sentenceFilter;
        this.nmeaSeconds = {};
        this.started = false;
    }
    setupNmeaReader() {
        this.readStream = fs.createReadStream(this.nmeaRecording);
        this.reader = readline.createInterface({
            input: this.readStream
        });
        this.reader.on('line', line => {
            if (line.split(',')[0] === '$GPGGA') {
                // If we already have data pause readline
                if (this.currentNmeaSecond) {
                    this.reader.pause();
                }
                this.currentNmeaSecond = Date.now();
                this.nmeaSeconds[this.currentNmeaSecond] = [];
            }
            if (!this.currentNmeaSecond) {
                return;
            }
            let addEntry = true;
            if (this.sentenceFilter) {
                addEntry = this.sentenceFilter.some((sentence) => {
                    return line.startsWith(`\$${sentence}`);
                });
            }
            if (addEntry) {
                this.nmeaSeconds[this.currentNmeaSecond].push(line);
            }
        });
        this.reader.on('close', () => {
            this.cleanUp();
        });
        this.reader.on('end', () => {
            this.cleanUp();
        });
        // TODO: setup error handling/file end
        this.nmeaTick = setInterval(() => {
            this.nextNmeaTick();
        }, 1000);
    }
    nextNmeaTick() {
        if (this.reader && this.readStream && this.readStream.isPaused()) {
            this.reader.resume();
        }
        if (!this.nmeaSeconds) {
            return;
        }
        const next = Object.keys(this.nmeaSeconds)[0];
        if (next) {
            const sentences = this.nmeaSeconds[next];
            sentences.forEach((sentence) => {
                this.emit('data', parseInt(next), new Uint8Array(Buffer.from(sentence)));
            });
            delete this.nmeaSeconds[next];
        }
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            const fileExists = yield new Promise((resolve) => fs.exists(this.nmeaRecording, resolve));
            if (!fileExists) {
                throw `NMEA recording with filename '${this.nmeaRecording}' does not exist.`;
            }
            this.started = true;
            this.setupNmeaReader();
        });
    }
    cleanUp() {
        this.emit('stopped');
        this.started = false;
        if (this.nmeaTick) {
            clearInterval(this.nmeaTick);
        }
        if (this.reader) {
            this.reader.close();
        }
        if (this.readStream) {
            this.readStream.close();
        }
    }
    stop() {
        this.cleanUp();
    }
    isStarted() {
        return this.started;
    }
}
exports.FakeGps = FakeGps;
//# sourceMappingURL=FakeGps.js.map