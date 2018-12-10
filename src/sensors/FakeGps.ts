import { EventEmitter } from 'events';
import { ISensor } from './Sensor';
import * as fs from 'fs';
import * as readline from 'readline';

export class FakeGps extends EventEmitter implements ISensor {
    private nmeaSentences: string[] = [];
    private sentenceIndex: number = 0;

    private reader?: readline.ReadLine;
    private readStream?: fs.ReadStream;

    private started = false;

    constructor(private readonly nmeaRecording: string, private readonly sentenceFilter: Array<string>) {
        super();
    }

    private readGPSData() {
        this.readStream = fs.createReadStream(this.nmeaRecording);
        this.reader = readline.createInterface({
            input: this.readStream
        });

        this.reader.on('line', line => {
            const matchesFilter = this.sentenceFilter.some((sentence: string) => {
                return line.startsWith(`\$${sentence}`);
            });
            if (matchesFilter) {
                this.nmeaSentences.push(line);
            }
        });

        console.log('nmeaSentences', this.nmeaSentences);

        this.reader.on('end', () => {
            this.cleanUp();
        });
    }

    private emitGPSData() {
        this.emit('data', Date.now(), new Uint8Array(Buffer.from(this.nmeaSentences[this.sentenceIndex])));
        this.sentenceIndex++;
    }

    async start(): Promise<void> {
        const fileExists = await new Promise((resolve) => fs.exists(this.nmeaRecording, resolve));

        if (!fileExists) {
            throw `NMEA recording with filename '${this.nmeaRecording}' does not exist.`;
        }

        this.started = true;

        this.readGPSData();

        if (this.nmeaSentences) {
            setInterval(() => {
                this.emitGPSData();
            }, 5000);
        }
    }

    private cleanUp() {
        if (this.reader) {
            this.reader.close();
        }

        if (this.readStream) {
            this.readStream.close();
        }
    }

    stop() {
        this.emit('stopped');
        this.started = false;
    }

    isStarted(): boolean {
        return this.started;
    }

}
