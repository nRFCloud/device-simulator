import { IHostConnection } from './HostConnection';
import { ShadowModelReported, ShadowModelDesired } from '../ShadowModel';
import { EventEmitter } from 'events';
import { Pairing } from '../pairing/Pairing';

export type OnUpdateShadow = (updateShadow: ShadowModelReported) => Promise<void>;
export type OnSendMessage = (topic: string, message: string) => Promise<void>;

export class FakeHostConnection extends EventEmitter implements IHostConnection {
    private onUpdateShadow: OnUpdateShadow;
    private onSendMessage: OnSendMessage;

    private d2c: string;

    constructor(onUpdateShadow?: OnUpdateShadow,
                onSendMessage?: OnSendMessage) {
        super();
        this.onUpdateShadow = onUpdateShadow;
        this.onSendMessage = onSendMessage;
    }

    connect(): Promise<void> {
        this.emit('connect');

        this.emit('shadowDelta', <ShadowModelDesired>{
            pairing: <Pairing>{
                state: 'initiate'
            }
        });

        return;
    }

    disconnect(): Promise<void> {
        this.emit('disconnect');
        return;
    }

    injectMessageToDevice(message: string) {
        this.emit('message', message);
    }

    async updateShadow(reported: ShadowModelReported): Promise<void> {
        console.debug(`Fake: Updating shadow.reported on host '${JSON.stringify(reported)}'`);

        if (this.onUpdateShadow) {
            await this.onUpdateShadow(reported);
        }
    }

    async sendMessage(message: string): Promise<void> {
        if (this.onSendMessage) {
            await this.onSendMessage(this.d2c, message);
        }

        return;
    }

    async setTopics(_c2d: string, d2c: string): Promise<void> {
        this.d2c = d2c;
    }
}
