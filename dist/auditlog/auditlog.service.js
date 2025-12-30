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
exports.AuditlogService = exports.AuditResource = exports.AuditAction = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const winston = __importStar(require("winston"));
require("winston-daily-rotate-file");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
var AuditAction;
(function (AuditAction) {
    AuditAction["SERVER_STARTUP"] = "SERVER_STARTUP";
    AuditAction["PM2_CONNECT"] = "PM2_CONNECT";
    AuditAction["PM2_DISCONNECT"] = "PM2_DISCONNECT";
    AuditAction["PM2_START_PROCESS"] = "PM2_START_PROCESS";
    AuditAction["PM2_STOP_PROCESS"] = "PM2_STOP_PROCESS";
    AuditAction["PM2_RESTART_PROCESS"] = "PM2_RESTART_PROCESS";
    AuditAction["PM2_DELETE_PROCESS"] = "PM2_DELETE_PROCESS";
    AuditAction["PM2_RESURRECT"] = "PM2_RESURRECT";
    AuditAction["PM2_SAVE"] = "PM2_SAVE";
    AuditAction["PM2_SEND_SIGNAL"] = "PM2_SEND_SIGNAL";
    AuditAction["PM2_SEND_DATA"] = "PM2_SEND_DATA";
    AuditAction["WEBSOCKET_CONNECT_ATTEMPT"] = "WEBSOCKET_CONNECT_ATTEMPT";
    AuditAction["WEBSOCKET_AUTH_SUCCESS"] = "WEBSOCKET_AUTH_SUCCESS";
    AuditAction["WEBSOCKET_AUTH_FAILURE"] = "WEBSOCKET_AUTH_FAILURE";
    AuditAction["WEBSOCKET_DISCONNECT"] = "WEBSOCKET_DISCONNECT";
    AuditAction["WEBSOCKET_MESSAGE"] = "WEBSOCKET_MESSAGE";
    AuditAction["CONSOLE_COMMAND"] = "CONSOLE_COMMAND";
    AuditAction["SYSTEM_ERROR"] = "SYSTEM_ERROR";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditResource;
(function (AuditResource) {
    AuditResource["SYSTEM"] = "SYSTEM";
    AuditResource["PM2"] = "PM2";
    AuditResource["WEBSOCKET"] = "WEBSOCKET";
    AuditResource["CONSOLE"] = "CONSOLE";
})(AuditResource || (exports.AuditResource = AuditResource = {}));
let AuditlogService = class AuditlogService {
    configService;
    logger;
    constructor(configService) {
        this.configService = configService;
        const logDir = this.configService?.get('LOG_DIR') ||
            process.env.LOG_DIR ||
            './meopanel/logs';
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }
        this.logger = winston.createLogger({
            level: 'silly',
            format: winston.format.combine(winston.format.timestamp({ format: 'HH:mm:ss DD/MM/YYYY' }), winston.format.ms(), winston.format.errors({ stack: true }), winston.format.printf(({ level, message, timestamp, context, ms }) => {
                const ctx = context || '';
                const displayLevel = level === 'info' ? 'log' : level;
                return `[Nest] ${process.pid}  - ${timestamp}     ${displayLevel.toUpperCase()} [${ctx}] ${message} ${ms}`;
            })),
            transports: [
                new winston.transports.DailyRotateFile({
                    filename: path.join(logDir, 'app-%DATE%.log'),
                    datePattern: 'YYYY-MM-DD',
                    maxSize: '20m',
                    maxFiles: '14d',
                }),
            ],
        });
    }
    logError(message, context = 'Application', error) {
        this.logger.error(message, { context, error });
    }
    logInfo(context, message) {
        common_1.Logger.log(message, context);
        this.logger.info(message, { context });
    }
    logWarn(message, context) {
        common_1.Logger.log(message, context);
        this.logger.warn(message, { context });
    }
    logAudit(data) {
        const auditMessage = `[AUDIT] ${data.action} | ${data.resource} | ${data.details} | Success: ${data.isSuccess}`;
        const logData = {
            context: 'Audit',
            action: data.action,
            resource: data.resource,
            details: data.details,
            isSuccess: data.isSuccess,
        };
        if (data.ipAddress)
            logData.ipAddress = data.ipAddress;
        if (data.userAgent)
            logData.userAgent = data.userAgent;
        if (data.sessionId)
            logData.sessionId = data.sessionId;
        if (data.metadata)
            logData.metadata = data.metadata;
        common_1.Logger.log(auditMessage, 'Audit');
        this.logger.info(auditMessage, logData);
    }
    logServerStartup(port) {
        this.logAudit({
            action: AuditAction.SERVER_STARTUP,
            resource: AuditResource.SYSTEM,
            details: `Server started on port ${port}`,
            isSuccess: true,
        });
    }
    logPm2Connect() {
        this.logAudit({
            action: AuditAction.PM2_CONNECT,
            resource: AuditResource.PM2,
            details: 'Connected to PM2',
            isSuccess: true,
        });
    }
    logPm2Action(action, processId, details, success = true) {
        this.logAudit({
            action,
            resource: AuditResource.PM2,
            details: details || `${action.replace('PM2_', '').toLowerCase()} ${processId ? `process ${processId}` : ''}`,
            isSuccess: success,
        });
    }
    logWebSocketConnectAttempt(ip) {
        this.logAudit({
            action: AuditAction.WEBSOCKET_CONNECT_ATTEMPT,
            resource: AuditResource.WEBSOCKET,
            details: `Connection attempt from IP: ${ip}`,
            ipAddress: ip,
            isSuccess: true,
        });
    }
    logWebSocketAuthSuccess(ip) {
        this.logAudit({
            action: AuditAction.WEBSOCKET_AUTH_SUCCESS,
            resource: AuditResource.WEBSOCKET,
            details: `Authenticated connection from IP: ${ip}`,
            ipAddress: ip,
            isSuccess: true,
        });
    }
    logWebSocketAuthFailure(ip, token) {
        this.logAudit({
            action: AuditAction.WEBSOCKET_AUTH_FAILURE,
            resource: AuditResource.WEBSOCKET,
            details: `Authentication failed from IP: ${ip}`,
            ipAddress: ip,
            metadata: { tokenPrefix: token?.substring(0, 10) },
            isSuccess: false,
        });
    }
    logConsoleCommand(command, success = true) {
        this.logAudit({
            action: AuditAction.CONSOLE_COMMAND,
            resource: AuditResource.CONSOLE,
            details: `Executed command: ${command}`,
            metadata: { command },
            isSuccess: success,
        });
    }
    logSystemError(error, context) {
        this.logAudit({
            action: AuditAction.SYSTEM_ERROR,
            resource: AuditResource.SYSTEM,
            details: `${context}: ${error}`,
            metadata: { error },
            isSuccess: false,
        });
    }
    logConsoleOnly(message, context = 'Application') {
        common_1.Logger.log(message, context);
    }
    logWebSocketMessage(clientId, clientName, command) {
        this.logConsoleOnly(`WS Message from client ${clientName || clientId}: command ${command}`, 'WebSocket');
    }
    logWebSocketDisconnect(clientId, clientName, activeConnections) {
        this.logAudit({
            action: AuditAction.WEBSOCKET_DISCONNECT,
            resource: AuditResource.WEBSOCKET,
            details: `Connection closed. Client: ${clientName || clientId}. Total active connections: ${activeConnections}`,
            isSuccess: true,
        });
    }
    logWebSocketAuthenticated(clientId, clientName, activeConnections) {
        this.logAudit({
            action: AuditAction.WEBSOCKET_AUTH_SUCCESS,
            resource: AuditResource.WEBSOCKET,
            details: `Client authenticated. Client: ${clientName || clientId}. Total active connections: ${activeConnections}`,
            isSuccess: true,
        });
    }
};
exports.AuditlogService = AuditlogService;
exports.AuditlogService = AuditlogService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], AuditlogService);
//# sourceMappingURL=auditlog.service.js.map