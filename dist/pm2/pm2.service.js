"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const console_service_1 = require("../console/console.service");
const pm2_1 = __importDefault(require("pm2"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let Pm2Service = class Pm2Service {
    auditlogService;
    consoleService;
    notesFile = path.join(process.env.ROOT_DIR || './meopanel/data', 'pm2', 'notes.json');
    notes = {};
    constructor(auditlogService, consoleService) {
        this.auditlogService = auditlogService;
        this.consoleService = consoleService;
    }
    loadNotes() {
        try {
            if (fs.existsSync(this.notesFile)) {
                const data = fs.readFileSync(this.notesFile, 'utf8');
                this.notes = JSON.parse(data);
            }
            else {
                this.notes = {};
            }
        }
        catch (error) {
            this.auditlogService.logSystemError('Failed to load PM2 notes', 'PM2');
            this.notes = {};
        }
    }
    saveNotes() {
        try {
            const dir = path.dirname(this.notesFile);
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
            fs.writeFileSync(this.notesFile, JSON.stringify(this.notes, null, 2));
        }
        catch (error) {
            this.auditlogService.logSystemError('Failed to save PM2 notes', 'PM2');
        }
    }
    getNotes(serverId) {
        return this.notes[serverId] || {};
    }
    setNote(serverId, processName, note) {
        if (!this.notes[serverId]) {
            this.notes[serverId] = {};
        }
        this.notes[serverId][processName] = note;
        this.saveNotes();
    }
    async onModuleInit() {
        this.loadNotes();
        return new Promise((resolve, reject) => {
            pm2_1.default.connect((err) => {
                if (err) {
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_CONNECT, undefined, 'Failed to connect to PM2', false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Connect();
                resolve();
            });
        });
    }
    async getProcessList() {
        return new Promise((resolve, reject) => {
            pm2_1.default.list((err, processList) => {
                if (err) {
                    this.auditlogService.logSystemError('Failed to get PM2 process list', 'PM2');
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
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_START_PROCESS, options.name, `Failed to start PM2 process: ${options.name}`, false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_START_PROCESS, name || script, `Started process: ${name || script}`);
                resolve(proc);
            });
        });
    }
    async stopProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.stop(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_STOP_PROCESS, id, `Failed to stop PM2 process: ${id}`, false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_STOP_PROCESS, id, `Stopped process: ${id}`);
                resolve(proc);
            });
        });
    }
    async restartProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.restart(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_RESTART_PROCESS, id, `Failed to restart PM2 process: ${id}`, false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_RESTART_PROCESS, id, `Restarted process: ${id}`);
                resolve(proc);
            });
        });
    }
    async deleteProcess(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.delete(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_DELETE_PROCESS, id, `Failed to delete PM2 process: ${id}`, false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_DELETE_PROCESS, id, `Deleted process: ${id}`);
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
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_RESURRECT, undefined, 'Failed to resurrect PM2 processes', false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_RESURRECT, undefined, 'Resurrected processes');
                resolve({});
            });
        });
    }
    async save() {
        return new Promise((resolve, reject) => {
            pm2_1.default.dump((err) => {
                if (err) {
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_SAVE, undefined, 'Failed to save PM2 processes', false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_SAVE, undefined, 'Saved PM2 processes');
                resolve({});
            });
        });
    }
    async getLogs(id, lines = 200) {
        return new Promise((resolve, reject) => {
            pm2_1.default.describe(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logSystemError('Failed to describe PM2 process', 'PM2');
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
                    this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_SEND_SIGNAL, id, `Failed to send signal to PM2 process: ${id}`, false);
                    reject(err);
                    return;
                }
                this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_SEND_SIGNAL, id, `Sent signal ${signal} to process: ${id}`);
                resolve(proc);
            });
        });
    }
    async sendData(id, data) {
        return new Promise((resolve, reject) => {
            pm2_1.default.describe(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logSystemError('Failed to describe PM2 process for sendData', 'PM2');
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
                if (!pmId) {
                    reject(new Error('PM2 process ID not found'));
                    return;
                }
                if (pm2Env.status !== 'online') {
                    reject(new Error(`Process is not online (status: ${pm2Env.status})`));
                    return;
                }
                const { spawn } = require('child_process');
                const pm2Process = spawn('pm2', ['send', pmId.toString(), data], { shell: true });
                let stdout = '';
                let stderr = '';
                pm2Process.stdout.on('data', (data) => {
                    stdout += data.toString();
                });
                pm2Process.stderr.on('data', (data) => {
                    stderr += data.toString();
                });
                pm2Process.on('close', (code) => {
                    if (code === 0) {
                        this.auditlogService.logPm2Action(auditlog_service_1.AuditAction.PM2_SEND_DATA, pmId, `Executed pm2 send command successfully: pm2 send ${pmId} "${data}"`);
                        resolve({ stdout, stderr });
                    }
                    else {
                        reject(new Error(`pm2 send failed with code ${code}: ${stderr}`));
                    }
                });
                pm2Process.on('error', (error) => {
                    reject(error);
                });
            });
        });
    }
    async getProcessCwd(id) {
        return new Promise((resolve, reject) => {
            pm2_1.default.describe(id, (err, proc) => {
                if (err) {
                    this.auditlogService.logSystemError('Failed to describe PM2 process for getProcessCwd', 'PM2');
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
                const cwd = pm2Env.pm_cwd;
                if (!cwd) {
                    reject(new Error('PM2 cwd not found'));
                    return;
                }
                resolve(cwd);
            });
        });
    }
    async listFiles(id, relativePath = '') {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
                if (err) {
                    reject(err);
                    return;
                }
                const fileList = files.map(file => ({
                    name: file.name,
                    isDirectory: file.isDirectory(),
                    size: file.isFile() ? fs.statSync(path.join(fullPath, file.name)).size : 0,
                    modified: file.isFile() ? fs.statSync(path.join(fullPath, file.name)).mtime : null,
                }));
                resolve(fileList);
            });
        });
    }
    async readFile(id, relativePath) {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.readFile(fullPath, 'utf8', (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(data);
            });
        });
    }
    async writeFile(id, relativePath, content) {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(fullPath, content, 'utf8', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    async createFile(id, relativePath, content = '') {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.writeFile(fullPath, content, 'utf8', (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    async createFolder(id, relativePath) {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.mkdir(fullPath, { recursive: true }, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    async deleteFile(id, relativePath) {
        const cwd = await this.getProcessCwd(id);
        const fullPath = path.resolve(cwd, relativePath);
        if (!fullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.stat(fullPath, (err, stats) => {
                if (err) {
                    reject(err);
                    return;
                }
                if (stats.isDirectory()) {
                    fs.rmdir(fullPath, { recursive: true }, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }
                else {
                    fs.unlink(fullPath, (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve();
                    });
                }
            });
        });
    }
    async renameFile(id, oldPath, newName) {
        const cwd = await this.getProcessCwd(id);
        const oldFullPath = path.resolve(cwd, oldPath);
        const newFullPath = path.resolve(cwd, path.dirname(oldPath), newName);
        if (!oldFullPath.startsWith(cwd) || !newFullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.rename(oldFullPath, newFullPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    async moveFile(id, sourcePath, destinationPath) {
        const cwd = await this.getProcessCwd(id);
        const sourceFullPath = path.resolve(cwd, sourcePath);
        const destinationFullPath = path.resolve(cwd, destinationPath);
        if (!sourceFullPath.startsWith(cwd) || !destinationFullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        return new Promise((resolve, reject) => {
            fs.rename(sourceFullPath, destinationFullPath, (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });
    }
    async pasteFiles(id, clipboard, destinationPath) {
        const cwd = await this.getProcessCwd(id);
        const destinationFullPath = path.resolve(cwd, destinationPath);
        if (!destinationFullPath.startsWith(cwd)) {
            throw new Error('Access denied: Path outside of process directory');
        }
        for (const file of clipboard.files) {
            const sourcePath = file.name;
            const sourceFullPath = path.resolve(cwd, sourcePath);
            const fileName = path.basename(sourcePath);
            const destFilePath = path.join(destinationFullPath, fileName);
            if (!sourceFullPath.startsWith(cwd)) {
                throw new Error('Access denied: Source path outside of process directory');
            }
            if (clipboard.type === 'cut') {
                await new Promise((resolve, reject) => {
                    fs.rename(sourceFullPath, destFilePath, (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
            else {
                if (file.isDirectory) {
                    continue;
                }
                await new Promise((resolve, reject) => {
                    fs.copyFile(sourceFullPath, destFilePath, (err) => {
                        if (err)
                            reject(err);
                        else
                            resolve();
                    });
                });
            }
        }
    }
    async zipFiles(id, filePaths, zipName) {
        throw new Error('Zip functionality not implemented');
    }
    async unzipFile(id, zipPath, destinationPath) {
        throw new Error('Unzip functionality not implemented');
    }
};
exports.Pm2Service = Pm2Service;
exports.Pm2Service = Pm2Service = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auditlog_service_1.AuditlogService, console_service_1.ConsoleService])
], Pm2Service);
//# sourceMappingURL=pm2.service.js.map