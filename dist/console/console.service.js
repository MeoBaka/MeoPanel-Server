"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConsoleService = void 0;
const common_1 = require("@nestjs/common");
const child_process_1 = require("child_process");
let ConsoleService = class ConsoleService {
    async sendToProcess(id, data) {
        return new Promise((resolve, reject) => {
            const pm2 = (0, child_process_1.spawn)('pm2', ['send', id, data], { shell: true });
            let stdout = '';
            let stderr = '';
            pm2.stdout.on('data', (data) => {
                stdout += data.toString();
            });
            pm2.stderr.on('data', (data) => {
                stderr += data.toString();
            });
            pm2.on('close', (code) => {
                if (code === 0) {
                    resolve(stdout);
                }
                else {
                    reject(new Error(stderr || `Process exited with code ${code}`));
                }
            });
            pm2.on('error', (error) => {
                reject(error);
            });
        });
    }
};
exports.ConsoleService = ConsoleService;
exports.ConsoleService = ConsoleService = __decorate([
    (0, common_1.Injectable)()
], ConsoleService);
//# sourceMappingURL=console.service.js.map