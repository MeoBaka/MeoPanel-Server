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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConnectService = void 0;
const common_1 = require("@nestjs/common");
const os = __importStar(require("os"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const pm2_service_1 = require("../pm2/pm2.service");
let ConnectService = class ConnectService {
    pm2Service;
    constructor(pm2Service) {
        this.pm2Service = pm2Service;
    }
    async connect() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const cpus = os.cpus();
        const cpuUsagePercent = await this.getCpuUsage();
        const diskSpace = this.getDiskSpace();
        const instances = this.getInstances();
        const pm2Stats = await this.getPm2Stats();
        const platform = this.getPlatform();
        const version = {
            node: process.version,
            server: process.env.VERSION || '1.0.0',
        };
        const host = process.env.HWSHOST || 'localhost';
        const port = process.env.HWSPORT || 3000;
        return {
            connection_address: `ws://${host}:${port}`,
            memory: {
                total: totalMemory,
                used: usedMemory,
                free: freeMemory,
            },
            cpu: {
                cores: cpus.length,
                usage: cpuUsagePercent,
            },
            disk_space: {
                used: diskSpace.used,
                max: diskSpace.max,
                allow: diskSpace.allow,
            },
            total_instances: instances.total,
            running_instances: instances.running,
            stopped_instances: instances.stopped,
            total_pm2: pm2Stats.total,
            running_pm2: pm2Stats.running,
            stopped_pm2: pm2Stats.stopped,
            platform,
            version,
        };
    }
    async getCpuUsage() {
        const start = os.cpus().map(cpu => ({
            user: cpu.times.user,
            nice: cpu.times.nice,
            sys: cpu.times.sys,
            idle: cpu.times.idle,
            irq: cpu.times.irq,
        }));
        await new Promise(resolve => setTimeout(resolve, 100));
        const end = os.cpus().map(cpu => ({
            user: cpu.times.user,
            nice: cpu.times.nice,
            sys: cpu.times.sys,
            idle: cpu.times.idle,
            irq: cpu.times.irq,
        }));
        let totalIdle = 0;
        let totalTick = 0;
        for (let i = 0; i < start.length; i++) {
            const startTimes = start[i];
            const endTimes = end[i];
            const idle = endTimes.idle - startTimes.idle;
            const tick = (endTimes.user - startTimes.user) + (endTimes.nice - startTimes.nice) + (endTimes.sys - startTimes.sys) + (endTimes.idle - startTimes.idle) + (endTimes.irq - startTimes.irq);
            totalIdle += idle;
            totalTick += tick;
        }
        const usage = 100 - ~~(100 * totalIdle / totalTick);
        return usage;
    }
    getDiskSpace() {
        const diskSpaceStr = process.env.DISK_SPACE || '100GB';
        const maxBytes = this.parseSize(diskSpaceStr);
        const available = this.getAvailableDiskSpace();
        if (available < maxBytes) {
            console.warn(`Warning: Available disk space (${this.formatBytes(available)}) is less than required (${diskSpaceStr})`);
        }
        const rootDir = process.env.ROOT_DIR || '/meopanel/data';
        const logDir = process.env.LOG_DIR || '/meopanel/logs';
        const instanceDir = process.env.INSTANCE_DIR || '/meopanel/instances';
        const used = this.getFolderSize(rootDir) +
            this.getFolderSize(logDir) +
            this.getFolderSize(instanceDir);
        return {
            allow: maxBytes,
            used,
            max: maxBytes,
        };
    }
    parseSize(sizeStr) {
        const match = sizeStr.match(/^(\d+)(GB|MB|KB|B)?$/i);
        if (!match)
            return 100 * 1024 * 1024 * 1024;
        const num = parseInt(match[1]);
        const unit = match[2]?.toUpperCase();
        switch (unit) {
            case 'GB':
                return num * 1024 * 1024 * 1024;
            case 'MB':
                return num * 1024 * 1024;
            case 'KB':
                return num * 1024;
            default:
                return num;
        }
    }
    getAvailableDiskSpace() {
        try {
            if (os.platform() === 'win32') {
                return 100 * 1024 * 1024 * 1024;
            }
            else {
                return 200 * 1024 * 1024 * 1024;
            }
        }
        catch {
            return 100 * 1024 * 1024 * 1024;
        }
    }
    getFolderSize(folderPath) {
        let totalSize = 0;
        try {
            const files = fs.readdirSync(folderPath);
            for (const file of files) {
                const filePath = path.join(folderPath, file);
                const stat = fs.statSync(filePath);
                if (stat.isDirectory()) {
                    totalSize += this.getFolderSize(filePath);
                }
                else {
                    totalSize += stat.size;
                }
            }
        }
        catch {
        }
        return totalSize;
    }
    formatBytes(bytes) {
        if (bytes === 0)
            return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    async getPm2Stats() {
        try {
            const processList = await this.pm2Service.getProcessList();
            const total = processList.length;
            const running = processList.filter(proc => proc.pm2_env.status === 'online').length;
            const stopped = total - running;
            return {
                total,
                running,
                stopped,
            };
        }
        catch (error) {
            console.error('Failed to get PM2 stats:', error);
            return {
                total: 0,
                running: 0,
                stopped: 0,
            };
        }
    }
    getInstances() {
        return {
            total: 0,
            running: 0,
            stopped: 0,
        };
    }
    getPlatform() {
        const platform = os.platform();
        if (platform === 'win32') {
            return 'windows';
        }
        else if (platform === 'linux') {
            try {
                const osRelease = fs.readFileSync('/etc/os-release', 'utf-8');
                const idMatch = osRelease.match(/^ID=(.*)$/m);
                if (idMatch) {
                    return idMatch[1].replace(/"/g, '');
                }
            }
            catch {
            }
            return 'linux';
        }
        else if (platform === 'darwin') {
            return 'macos';
        }
        return platform;
    }
};
exports.ConnectService = ConnectService;
exports.ConnectService = ConnectService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [pm2_service_1.Pm2Service])
], ConnectService);
//# sourceMappingURL=connect.service.js.map