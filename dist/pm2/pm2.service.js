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
    async stopProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.stop(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to stop PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Stopped process: ${id}`);
                resolve(proc);
            });
        });
    }
    async restartProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.restart(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to restart PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Restarted process: ${id}`);
                resolve(proc);
            });
        });
    }
    async deleteProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.delete(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to delete PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Deleted process: ${id}`);
                resolve(proc);
            });
        });
    }
    async multiStart(processes) {
        const promises = processes.map((proc) => this.startProcess(proc.script, proc.name));
        return Promise.all(promises);
    }
    async multiStop(ids) {
        const promises = ids.map((id) => this.stopProcess(id));
        return Promise.all(promises);
    }
    async multiRestart(ids) {
        const promises = ids.map((id) => this.restartProcess(id));
        return Promise.all(promises);
    }
    async multiDelete(ids) {
        const promises = ids.map((id) => this.deleteProcess(id));
        return Promise.all(promises);
    }
    async resurrect() {
        return new Promise((resolve, reject) => {
            pm2_1.default.resurrect((err) => {
                if (err) {
                    this.auditlogService.logError('Failed to resurrect PM2 processes', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', 'Resurrected processes');
                resolve({});
            });
        });
    }
    async save() {
        return new Promise((resolve, reject) => {
            pm2_1.default.dump((err) => {
                if (err) {
                    this.auditlogService.logError('Failed to save PM2 processes', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', 'Saved PM2 processes');
                resolve({});
            });
        });
    }
    async getLogs(id, lines = 200) {
        return new Promise((resolve, reject) => {
            pm2_1.default.describe(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to describe PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                if (!proc || proc.length === 0) {
                    reject(new Error('Process not found'));
                    return;
                }
                const pm2Env = proc[0].pm2_env;
                if (!pm2Env) {
                    reject(new Error('PM2 env not found'));
                    return;
                }
                const logFile = pm2Env.pm_out_log_path || pm2Env.pm_log_path;
                if (!logFile) {
                    reject(new Error('Log file not found'));
                    return;
                }
                const fs = require('fs');
                fs.readFile(logFile, 'utf8', (err, data) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const linesArray = data.split('\n').filter((line) => line.trim());
                    const lastLines = linesArray.slice(-lines);
                    resolve({ logs: lastLines, logFile });
                });
            });
        });
    }
    async sendSignal(id, signal) {
        return new Promise((resolve, reject) => {
            pm2_1.default.sendSignalToProcessName(signal, id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to send signal to PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                this.auditlogService.logInfo('PM2', `Sent signal ${signal} to process: ${id}`);
                resolve(proc);
            });
        });
    }
    async sendData(id, data) {
        return new Promise((resolve, reject) => {
            pm2_1.default.describe(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logError('Failed to describe PM2 process', 'PM2', err);
                    reject(err);
                    return;
                }
                if (!proc || proc.length === 0) {
                    reject(new Error('Process not found'));
                    return;
                }
                const pm2Env = proc[0].pm2_env;
                if (!pm2Env) {
                    reject(new Error('PM2 env not found'));
                    return;
                }
                const pmId = proc[0].pm_id;
                if (pm2Env.status !== 'online') {
                    reject(new Error(`Process is not online (status: ${pm2Env.status})`));
                    return;
                }
                pm2_1.default.sendDataToProcessId({ id: pmId, data: data, topic: 'message' }, (err, res) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    this.auditlogService.logInfo('PM2', `Sent data to process: ${id}`);
                    resolve(res);
                });
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