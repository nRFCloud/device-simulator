import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
import * as fs from 'fs';
import * as readline from 'readline';

export class FakeGps extends EventEmitter implements ISensor {
    private readonly nmeaSeconds: any = {};
    private currentNmeaSecond?: number;

    private reader?: readline.ReadLine;
    private readStream?: fs.ReadStream;
    private nmeaTick?: NodeJS.Timer;

    private started = false;

    constructor(private readonly nmeaRecording: string, private readonly sentenceFilter: Array<string>) {
        super();
    }

    private setupNmeaReader() {
        this.readStream = fs.createReadStream(this.nmeaRecording);
        this.reader = readline.createInterface({
            input: this.readStream
        });

        this.reader.on('line', line => {
            if (line.split(',')[0] === '$GPGGA') {
                // If we already have data pause readline
                if (this.currentNmeaSecond) {
                    this.reader!.pause();
                }

                this.currentNmeaSecond = Date.now();
                this.nmeaSeconds[this.currentNmeaSecond] = [];
            }

            if (!this.currentNmeaSecond) {
                return;
            }

            let addEntry = true;

            if (this.sentenceFilter) {
                addEntry = this.sentenceFilter.some((sentence: string) => {
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

    private nextNmeaTick() {
        if (this.reader && this.readStream && this.readStream.isPaused()) {
            this.reader.resume();
        }

        if (!this.nmeaSeconds) {
            return;
        }

        const next = Object.keys(this.nmeaSeconds)[0];

        if (next) {
            const sentences = this.nmeaSeconds[next];

            sentences.forEach((sentence: string) => {
                this.emit('data', parseInt(next), new Uint8Array(Buffer.from(sentence)));
            });

            delete this.nmeaSeconds[next];
        }
    }

    async start(): Promise<void> {
        const fileExists = await new Promise((resolve) => fs.exists(this.nmeaRecording, resolve));

        if (!fileExists) {
            throw `NMEA recording with filename '${this.nmeaRecording}' does not exist.`;
        }

        this.started = true;

        this.setupNmeaReader();
    }

    private cleanUp() {
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

    isStarted(): boolean {
        return this.started;
    }

}
