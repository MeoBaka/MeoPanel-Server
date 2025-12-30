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
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const ping_service_1 = require("../ping/ping.service");
const connect_service_1 = require("../connect/connect.service");
const pm2_service_1 = require("../pm2/pm2.service");
const meoguard_guard_1 = require("../meoguard/meoguard.guard");
const auditlog_service_1 = require("../auditlog/auditlog.service");
const fs = require('fs');
let WsGateway = class WsGateway {
    pingService;
    connectService;
    pm2Service;
    meoGuard;
    auditlogService;
    server;
    logWatchers = new Map();
    listWatchers = new Map();
    statusWatchers = new Map();
    activeConnections = 0;
    clientCounter = 0;
    constructor(pingService, connectService, pm2Service, meoGuard, auditlogService) {
        this.pingService = pingService;
        this.connectService = connectService;
        this.pm2Service = pm2Service;
        this.meoGuard = meoGuard;
        this.auditlogService = auditlogService;
    }
    handleConnection(client) {
        client.id = `ws_${++this.clientCounter}`;
        this.activeConnections++;
        client.on('message', async (message) => {
            const msg = message.toString();
            try {
                const data = JSON.parse(msg);
                if (data.command) {
                    this.auditlogService.logWebSocketMessage(client.id, client.clientName, data.command);
                }
                if (data.command === 'pm2-list') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const processList = await this.pm2Service.getProcessList();
                            const listKey = `${client.id}-pm2-list`;
                            const listString = JSON.stringify(processList);
                            const existing = this.listWatchers.get(listKey);
                            if (existing) {
                                clearInterval(existing.interval);
                                this.listWatchers.delete(listKey);
                            }
                            client.send(JSON.stringify({
                                type: 'pm2-list',
                                data: processList,
                                timestamp: data.timestamp,
                            }));
                            let lastPingTime = Date.now();
                            const interval = setInterval(async () => {
                                try {
                                    const newList = await this.pm2Service.getProcessList();
                                    const newListString = JSON.stringify(newList);
                                    const watcher = this.listWatchers.get(listKey);
                                    const now = Date.now();
                                    if (watcher && (newListString !== watcher.lastList || now - lastPingTime > 5000)) {
                                        client.send(JSON.stringify({
                                            type: 'pm2-list',
                                            data: newList,
                                            timestamp: now,
                                        }));
                                        watcher.lastList = newListString;
                                        lastPingTime = now;
                                    }
                                }
                                catch (error) {
                                }
                            }, 1000);
                            this.listWatchers.set(listKey, { interval, lastList: listString });
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to get PM2 process list',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-start') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.startProcess(data.script, data.name);
                            client.send(JSON.stringify({
                                type: 'pm2-start',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to start PM2 process',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-stop') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.stopProcess(parseInt(data.id));
                            client.send(JSON.stringify({
                                type: 'pm2-stop',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to stop PM2 process',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-restart') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.restartProcess(parseInt(data.id));
                            client.send(JSON.stringify({
                                type: 'pm2-restart',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to restart PM2 process',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-delete') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.deleteProcess(parseInt(data.id));
                            client.send(JSON.stringify({
                                type: 'pm2-delete',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to delete PM2 process',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-multi-start') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.multiStart(data.processes);
                            client.send(JSON.stringify({
                                type: 'pm2-multi-start',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to start multiple PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-multi-stop') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.multiStop(data.ids.map(id => parseInt(id)));
                            client.send(JSON.stringify({
                                type: 'pm2-multi-stop',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to stop multiple PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-multi-restart') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.multiRestart(data.ids.map(id => parseInt(id)));
                            client.send(JSON.stringify({
                                type: 'pm2-multi-restart',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to restart multiple PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-multi-delete') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.multiDelete(data.ids.map(id => parseInt(id)));
                            client.send(JSON.stringify({
                                type: 'pm2-multi-delete',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to delete multiple PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-resurrect') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.resurrect();
                            client.send(JSON.stringify({
                                type: 'pm2-resurrect',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to resurrect PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-save') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.save();
                            client.send(JSON.stringify({
                                type: 'pm2-save',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to save PM2 processes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-logs') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.getLogs(parseInt(data.id), data.lines || 200);
                            client.send(JSON.stringify({
                                type: 'pm2-logs',
                                data: result.logs,
                            }));
                            const watcherKey = `${client.id}-${data.id}`;
                            const existing = this.logWatchers.get(watcherKey);
                            if (existing) {
                                fs.unwatchFile(existing.logFile);
                                this.logWatchers.delete(watcherKey);
                            }
                            let lastSize = fs.statSync(result.logFile).size;
                            fs.watchFile(result.logFile, { interval: 1000 }, (curr, prev) => {
                                if (curr.size > lastSize) {
                                    const stream = fs.createReadStream(result.logFile, { start: lastSize, end: curr.size - 1, encoding: 'utf8' });
                                    let newData = '';
                                    stream.on('data', (chunk) => {
                                        newData += chunk;
                                    });
                                    stream.on('end', () => {
                                        const newLines = newData.split('\n').filter(line => line.trim());
                                        if (newLines.length > 0) {
                                            client.send(JSON.stringify({
                                                type: 'pm2-logs',
                                                data: newLines,
                                            }));
                                        }
                                        lastSize = curr.size;
                                    });
                                }
                            });
                            this.logWatchers.set(watcherKey, { logFile: result.logFile, lastSize });
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to get PM2 logs',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-send') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.sendData(parseInt(data.id), data.data);
                            client.send(JSON.stringify({
                                type: 'pm2-send',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: `Failed to send data to PM2 process: ${error.message}`,
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-stop-logs') {
                    const watcherKey = `${client.id}-${data.id}`;
                    const entry = this.logWatchers.get(watcherKey);
                    if (entry) {
                        fs.unwatchFile(entry.logFile);
                        this.logWatchers.delete(watcherKey);
                    }
                }
                else if (data.command === 'pm2-list-files') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.listFiles(parseInt(data.id), data.relativePath || '');
                            client.send(JSON.stringify({
                                type: 'pm2-list-files',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to list files',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-read-file') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const result = await this.pm2Service.readFile(parseInt(data.id), data.relativePath);
                            client.send(JSON.stringify({
                                type: 'pm2-read-file',
                                data: result,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to read file',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-write-file') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            await this.pm2Service.writeFile(parseInt(data.id), data.relativePath, data.content);
                            client.send(JSON.stringify({
                                type: 'pm2-write-file',
                                data: { success: true },
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to write file',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-stop-list') {
                    const listKey = `${client.id}-pm2-list`;
                    const entry = this.listWatchers.get(listKey);
                    if (entry) {
                        clearInterval(entry.interval);
                        this.listWatchers.delete(listKey);
                    }
                }
                else if (data.command === 'status-stop') {
                    const statusKey = `${client.id}-status`;
                    const entry = this.statusWatchers.get(statusKey);
                    if (entry) {
                        clearInterval(entry.interval);
                        this.statusWatchers.delete(statusKey);
                    }
                }
                else if (data.command === 'pm2-notes-get') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const notes = this.pm2Service.getNotes(data.uuid);
                            client.send(JSON.stringify({
                                type: 'pm2-notes-get',
                                data: notes,
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to get PM2 notes',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'pm2-notes-set') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            this.pm2Service.setNote(data.uuid, data.process_name, data.note);
                            client.send(JSON.stringify({
                                type: 'pm2-notes-set',
                                data: { success: true },
                            }));
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to set PM2 note',
                                error: error.message,
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for PM2 command',
                        }));
                    }
                }
                else if (data.command === 'status') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const connectData = await this.connectService.connect();
                            const statusKey = `${client.id}-status`;
                            const statusString = JSON.stringify(connectData);
                            const existing = this.statusWatchers.get(statusKey);
                            if (existing) {
                                clearInterval(existing.interval);
                                this.statusWatchers.delete(statusKey);
                            }
                            client.send(JSON.stringify({
                                type: 'status',
                                data: connectData,
                                timestamp: data.timestamp,
                            }));
                            const interval = setInterval(async () => {
                                try {
                                    const newStatus = await this.connectService.connect();
                                    const newStatusString = JSON.stringify(newStatus);
                                    const watcher = this.statusWatchers.get(statusKey);
                                    if (watcher && newStatusString !== watcher.lastStatus) {
                                        client.send(JSON.stringify({
                                            type: 'status',
                                            data: newStatus,
                                        }));
                                        watcher.lastStatus = newStatusString;
                                    }
                                }
                                catch (error) {
                                }
                            }, 1000);
                            this.statusWatchers.set(statusKey, { interval, lastStatus: statusString });
                        }
                        catch (error) {
                            client.send(JSON.stringify({
                                type: 'error',
                                message: 'Failed to get server status',
                            }));
                        }
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token for status command',
                        }));
                    }
                }
                else if (data.uuid && data.token) {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        if (data.clientName) {
                            client.clientName = data.clientName;
                        }
                        this.auditlogService.logWebSocketAuthenticated(client.id, client.clientName, this.activeConnections);
                        const connectData = await this.connectService.connect();
                        client.send(JSON.stringify(connectData));
                    }
                    else {
                        client.send(JSON.stringify({
                            type: 'error',
                            message: 'Unauthorized: Invalid UUID or token',
                        }));
                    }
                }
            }
            catch {
                if (msg === 'ping') {
                    client.send(JSON.stringify(this.pingService.ping()));
                }
            }
        });
    }
    handleDisconnect(client) {
        this.activeConnections--;
        this.auditlogService.logWebSocketDisconnect(client.id, client.clientName, this.activeConnections);
        for (const [key, entry] of this.logWatchers.entries()) {
            if (key.startsWith(`${client.id}-`)) {
                fs.unwatchFile(entry.logFile);
                this.logWatchers.delete(key);
            }
        }
        for (const [key, entry] of this.listWatchers.entries()) {
            if (key.startsWith(`${client.id}-`)) {
                clearInterval(entry.interval);
                this.listWatchers.delete(key);
            }
        }
        for (const [key, entry] of this.statusWatchers.entries()) {
            if (key.startsWith(`${client.id}-`)) {
                clearInterval(entry.interval);
                this.statusWatchers.delete(key);
            }
        }
    }
};
exports.WsGateway = WsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", ws_1.Server)
], WsGateway.prototype, "server", void 0);
exports.WsGateway = WsGateway = __decorate([
    (0, websockets_1.WebSocketGateway)(),
    __metadata("design:paramtypes", [ping_service_1.PingService,
        connect_service_1.ConnectService,
        pm2_service_1.Pm2Service,
        meoguard_guard_1.MeoGuard,
        auditlog_service_1.AuditlogService])
], WsGateway);
//# sourceMappingURL=ws.gateway.js.map