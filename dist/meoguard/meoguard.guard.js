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
exports.MeoGuard = void 0;
const common_1 = require("@nestjs/common");
const websockets_1 = require("@nestjs/websockets");
const auditlog_service_1 = require("../auditlog/auditlog.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
let MeoGuard = class MeoGuard {
    auditlogService;
    connectData;
    constructor(auditlogService) {
        this.auditlogService = auditlogService;
        this.loadConnectData();
    }
    loadConnectData() {
        const filePath = path.join(__dirname, '../../connect.json');
        if (fs.existsSync(filePath)) {
            this.connectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        }
    }
    async canActivate(context) {
        const client = context.switchToWs().getClient();
        const request = client.handshake;
        const token = request.query.token;
        const uuid = request.query.uuid;
        const ip = request.connection.remoteAddress || request.socket.remoteAddress;
        this.auditlogService.logInfo('WebSocket', `Connection attempt from IP: ${ip}`);
        const isValid = await this.validateCredentials(token, uuid);
        if (!isValid) {
            this.auditlogService.logError('WebSocket authentication failed', 'Auth', {
                ip,
                token: token?.substring(0, 10) + '...',
            });
            throw new websockets_1.WsException('Unauthorized');
        }
        this.auditlogService.logInfo('WebSocket', `Authenticated connection from IP: ${ip}`);
        return true;
    }
    async validateMessageCredentials(token, uuid) {
        if (!token || !uuid || !this.connectData) {
            return false;
        }
        return token === this.connectData.token && uuid === this.connectData.uuid;
    }
    async validateCredentials(token, uuid) {
        return this.validateMessageCredentials(token, uuid);
    }
};
exports.MeoGuard = MeoGuard;
exports.MeoGuard = MeoGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auditlog_service_1.AuditlogService])
], MeoGuard);
//# sourceMappingURL=meoguard.guard.js.map