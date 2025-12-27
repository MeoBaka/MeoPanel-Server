"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pm2Service = void 0;
const common_1 = require("@nestjs/common");
const auditlog_service_1 = require("../auditlog/auditlog.service");
const pm2_1 = __importDefault(require("pm2"));
let Pm2Service = class Pm2Service {
    auditlogService;
    constructor(auditlogService) {
        this.auditlogService = auditlogService;
    }
    async onModuleInit() {
        return new Promise((resolve, reject) => {
            pm2_1.default.connect((err) => {
                if (err) {
                    this.auditlogService.logError('Failed to connect to PM2', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', 'Connected to PM2');
                resolve();
            });
        });
    }
    async getProcessList() {
        return new Promise((resolve, reject) => {
            pm2_1.default.list((err, processList) => {
                if (err) {
                    this.auditlogService.logError('Failed to get PM2 process list', 'PM2', err);
                    reject(err);
                    return;
                }
                resolve(processList);
            });
        });
    }
    async startProcess(script, name) {
        return new Promise((resolve, reject) => {
            const options = {
                script,
                name: name || script,
            };
            pm2_1.default.start(options, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to start PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Started process: ${name || script}`);
                resolve(proc);
            });
        });
    }
    async stopProcess(name) {
        return new Promise((resolve, reject) => {
            pm2_1.default.stop(name, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to stop PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Stopped process: ${name}`);
                resolve(proc);
            });
        });
    }
    async restartProcess(name) {
        return new Promise((resolve, reject) => {
            pm2_1.default.restart(name, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to restart PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Restarted process: ${name}`);
                resolve(proc);
            });
        });
    }
    async deleteProcess(name) {
        return new Promise((resolve, reject) => {
            pm2_1.default.delete(name, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to delete PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Deleted process: ${name}`);
                resolve(proc);
            });
        });
    }
};
exports.Pm2Service = Pm2Service;
exports.Pm2Service = Pm2Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auditlog_service_1.AuditlogService])
], Pm2Service);
//# sourceMappingURL=pm2.service.js.map