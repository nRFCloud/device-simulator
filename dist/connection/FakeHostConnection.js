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
class FakeHostConnection extends events_1.EventEmitter {
    connect() {
        this.emit('connect');
        this.emit('shadowDelta', {
            pairing: {
                state: 'initiate'
            }
        });
    }
    disconnect() {
        this.emit('disconnect');
    }
    injectMessageToDevice(message) {
        this.emit('message', message);
    }
    updateShadow(_reported) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    sendMessage(_message) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
    setTopics(_c2d, _d2c) {
        return __awaiter(this, void 0, void 0, function* () { });
    }
}
exports.FakeHostConnection = FakeHostConnection;
//# sourceMappingURL=FakeHostConnection.js.map