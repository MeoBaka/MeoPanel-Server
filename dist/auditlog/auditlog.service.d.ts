import { ConfigService } from '@nestjs/config';
import 'winston-daily-rotate-file';
export declare enum AuditAction {
    SERVER_STARTUP = "SERVER_STARTUP",
    PM2_CONNECT = "PM2_CONNECT",
    PM2_DISCONNECT = "PM2_DISCONNECT",
    PM2_START_PROCESS = "PM2_START_PROCESS",
    PM2_STOP_PROCESS = "PM2_STOP_PROCESS",
    PM2_RESTART_PROCESS = "PM2_RESTART_PROCESS",
    PM2_DELETE_PROCESS = "PM2_DELETE_PROCESS",
    PM2_RESURRECT = "PM2_RESURRECT",
    PM2_SAVE = "PM2_SAVE",
    PM2_SEND_SIGNAL = "PM2_SEND_SIGNAL",
    PM2_SEND_DATA = "PM2_SEND_DATA",
    WEBSOCKET_CONNECT_ATTEMPT = "WEBSOCKET_CONNECT_ATTEMPT",
    WEBSOCKET_AUTH_SUCCESS = "WEBSOCKET_AUTH_SUCCESS",
    WEBSOCKET_AUTH_FAILURE = "WEBSOCKET_AUTH_FAILURE",
    WEBSOCKET_DISCONNECT = "WEBSOCKET_DISCONNECT",
    WEBSOCKET_MESSAGE = "WEBSOCKET_MESSAGE",
    CONSOLE_COMMAND = "CONSOLE_COMMAND",
    SYSTEM_ERROR = "SYSTEM_ERROR"
}
export declare enum AuditResource {
    SYSTEM = "SYSTEM",
    PM2 = "PM2",
    WEBSOCKET = "WEBSOCKET",
    CONSOLE = "CONSOLE"
}
export interface AuditLogData {
    action: AuditAction;
    resource: AuditResource;
    details: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    metadata?: any;
    isSuccess: boolean;
}
export declare class AuditlogService {
    private configService;
    private logger;
    constructor(configService: ConfigService);
    logError(message: string, context?: string, error?: unknown): void;
    logInfo(context: string, message: string): void;
    logWarn(message: string, context: string): void;
    logAudit(data: AuditLogData): void;
    logServerStartup(port: number): void;
    logPm2Connect(): void;
    logPm2Action(action: AuditAction, processId?: number | string, details?: string, success?: boolean): void;
    logWebSocketConnectAttempt(ip: string): void;
    logWebSocketAuthSuccess(ip: string): void;
    logWebSocketAuthFailure(ip: string, token?: string): void;
    logConsoleCommand(command: string, success?: boolean): void;
    logSystemError(error: string, context: string): void;
    logConsoleOnly(message: string, context?: string): void;
    logWebSocketMessage(clientId: string, clientName: string | undefined, command: string): void;
    logWebSocketDisconnect(clientId: string, clientName: string | undefined, activeConnections: number): void;
    logWebSocketAuthenticated(clientId: string, clientName: string | undefined, activeConnections: number): void;
}
