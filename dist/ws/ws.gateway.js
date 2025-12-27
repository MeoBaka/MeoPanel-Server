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
let WsGateway = class WsGateway {
    pingService;
    connectService;
    pm2Service;
    meoGuard;
    server;
    constructor(pingService, connectService, pm2Service, meoGuard) {
        this.pingService = pingService;
        this.connectService = connectService;
        this.pm2Service = pm2Service;
        this.meoGuard = meoGuard;
    }
    handleConnection(client) {
        client.on('message', async (message) => {
            const msg = message.toString();
            try {
                const data = JSON.parse(msg);
                if (data.command === 'pm2-list') {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        try {
                            const processList = await this.pm2Service.getProcessList();
                            client.send(JSON.stringify({
                                type: 'pm2-list',
                                data: processList,
                            }));
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
                else if (data.uuid && data.token) {
                    const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
                    if (isAuthenticated) {
                        client.send(JSON.stringify(this.connectService.connect()));
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
        meoguard_guard_1.MeoGuard])
], WsGateway);
//# sourceMappingURL=ws.gateway.js.map