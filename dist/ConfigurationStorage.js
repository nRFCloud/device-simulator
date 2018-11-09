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
const fs = require("fs");
class FileConfigurationStorage {
    constructor(configFilename) {
        this.configFilename = configFilename;
    }
    ensureConfigFileExists() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(this.configFilename)) {
                const fd = (yield new Promise((resolve) => fs.open(this.configFilename, 'w', resolve)));
                yield new Promise((resolve) => fs.write(fd, '{}', resolve));
                yield new Promise((resolve) => fs.close(fd, resolve));
            }
        });
    }
    getConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!fs.existsSync(this.configFilename)) {
                throw new Error(`Configuration file '${this.configFilename}' does not exist.`);
            }
            const configFileContent = (yield new Promise((resolve, reject) => fs.readFile(this.configFilename, 'utf8', (error, data) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(data);
                }
            })));
            const configFromFile = JSON.parse(configFileContent);
            return Object.assign({}, configFromFile);
        });
    }
    setConfiguration(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.ensureConfigFileExists();
            yield new Promise(resolve => fs.writeFile(this.configFilename, JSON.stringify(configuration), 'utf8', resolve));
        });
    }
}
exports.FileConfigurationStorage = FileConfigurationStorage;
class MemoryConfigurationStorage {
    constructor(configuration) {
        this.configuration = configuration;
    }
    getConfiguration() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.configuration;
        });
    }
    setConfiguration(configuration) {
        return __awaiter(this, void 0, void 0, function* () {
            this.configuration = configuration;
        });
    }
}
exports.MemoryConfigurationStorage = MemoryConfigurationStorage;
//# sourceMappingURL=ConfigurationStorage.js.map