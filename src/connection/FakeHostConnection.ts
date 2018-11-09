import { IHostConnection } from './HostConnection';
import { ShadowModelReported, ShadowModelDesired } from '../ShadowModel';
import { EventEmitter } from 'events';
import { Pairing } from '../pairing/Pairing';

export class FakeHostConnection extends EventEmitter implements IHostConnection {
    connect() {
        this.emit('connect');

        this.emit('shadowDelta', <ShadowModelDesired>{
            pairing: <Pairing>{
                state: 'initiate'
            }
        });
    }

    disconnect() {
        this.emit('disconnect');
    }

    injectMessageToDevice(message: string) {
        this.emit('message', message);
    }

    async updateShadow(_reported: ShadowModelReported): Promise<void> { }

    async sendMessage(_message: string): Promise<void> { }

    async setTopics(_c2d: string, _d2c: string): Promise<void> { }
}
