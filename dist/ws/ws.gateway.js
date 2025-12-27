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
exports.WsGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const ws_1 = require("ws");
const ping_service_1 = require("../ping/ping.service");
const connect_service_1 = require("../connect/connect.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const crypto_1 = require("crypto");
let WsGateway = class WsGateway {
    pingService;
    connectService;
    server;
    connectData;
    constructor(pingService, connectService) {
        this.pingService = pingService;
        this.connectService = connectService;
    }
    onModuleInit() {
        const filePath = path.join(__dirname, '../../connect.json');
        if (fs.existsSync(filePath)) {
            this.connectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
            if (!this.connectData.uuid || !this.connectData.token) {
                this.generateConnectData(filePath);
            }
        }
        else {
            this.generateConnectData(filePath);
        }
    }
    generateConnectData(filePath) {
        this.connectData = {
            uuid: (0, crypto_1.randomUUID)(),
            token: (0, crypto_1.randomUUID)().replace(/-/g, ''),
        };
        fs.writeFileSync(filePath, JSON.stringify(this.connectData, null, 2));
    }
    handleConnection(client) {
        client.on('message', (message) => {
            const msg = message.toString();
            try {
                const data = JSON.parse(msg);
                if (data.uuid === this.connectData.uuid &&
                    data.token === this.connectData.token) {
                    client.send(JSON.stringify(this.connectService.connect()));
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
        connect_service_1.ConnectService])
], WsGateway);
//# sourceMappingURL=ws.gateway.js.map