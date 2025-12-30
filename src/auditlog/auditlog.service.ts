import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

export enum AuditAction {
  // System actions
  SERVER_STARTUP = 'SERVER_STARTUP',

  // PM2 actions
  PM2_CONNECT = 'PM2_CONNECT',
  PM2_DISCONNECT = 'PM2_DISCONNECT',
  PM2_START_PROCESS = 'PM2_START_PROCESS',
  PM2_STOP_PROCESS = 'PM2_STOP_PROCESS',
  PM2_RESTART_PROCESS = 'PM2_RESTART_PROCESS',
  PM2_DELETE_PROCESS = 'PM2_DELETE_PROCESS',
  PM2_RESURRECT = 'PM2_RESURRECT',
  PM2_SAVE = 'PM2_SAVE',
  PM2_SEND_SIGNAL = 'PM2_SEND_SIGNAL',
  PM2_SEND_DATA = 'PM2_SEND_DATA',

  // WebSocket actions
  WEBSOCKET_CONNECT_ATTEMPT = 'WEBSOCKET_CONNECT_ATTEMPT',
  WEBSOCKET_AUTH_SUCCESS = 'WEBSOCKET_AUTH_SUCCESS',
  WEBSOCKET_AUTH_FAILURE = 'WEBSOCKET_AUTH_FAILURE',
  WEBSOCKET_DISCONNECT = 'WEBSOCKET_DISCONNECT',
  WEBSOCKET_MESSAGE = 'WEBSOCKET_MESSAGE',

  // Console actions
  CONSOLE_COMMAND = 'CONSOLE_COMMAND',

  // Error actions
  SYSTEM_ERROR = 'SYSTEM_ERROR',
}

export enum AuditResource {
  SYSTEM = 'SYSTEM',
  PM2 = 'PM2',
  WEBSOCKET = 'WEBSOCKET',
  CONSOLE = 'CONSOLE',
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

@Injectable()
export class AuditlogService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logDir =
      this.configService?.get<string>('LOG_DIR') ||
      process.env.LOG_DIR ||
      './meopanel/logs';

    // Ensure log directory exists
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

    this.logger = winston.createLogger({
      level: 'silly',
      format: winston.format.combine(
        winston.format.timestamp({ format: 'HH:mm:ss DD/MM/YYYY' }),
        winston.format.ms(),
        winston.format.errors({ stack: true }),
        winston.format.printf(({ level, message, timestamp, context, ms }) => {
          const ctx = context || '';
          const displayLevel = level === 'info' ? 'log' : level;
          return `[Nest] ${process.pid}  - ${timestamp}     ${displayLevel.toUpperCase()} [${ctx}] ${message} ${ms}`;
        }),
      ),
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

  logError(message: string, context = 'Application', error?: unknown) {
    this.logger.error(message, { context, error });
  }

  logInfo(context: string, message: string) {
    Logger.log(message, context); // Log to console
    this.logger.info(message, { context }); // Log to file
  }

  logWarn(message: string, context: string) {
    Logger.log(message, context); // Log to console
    this.logger.warn(message, { context }); // Log to file
  }

  logAudit(data: AuditLogData) {
    const auditMessage = `[AUDIT] ${data.action} | ${data.resource} | ${data.details} | Success: ${data.isSuccess}`;
    const logData: any = {
      context: 'Audit',
      action: data.action,
      resource: data.resource,
      details: data.details,
      isSuccess: data.isSuccess,
    };

    if (data.ipAddress) logData.ipAddress = data.ipAddress;
    if (data.userAgent) logData.userAgent = data.userAgent;
    if (data.sessionId) logData.sessionId = data.sessionId;
    if (data.metadata) logData.metadata = data.metadata;

    // Log to console
    Logger.log(auditMessage, 'Audit');

    // Log to file with structured data
    this.logger.info(auditMessage, logData);
  }

  // Convenience methods for common audit actions
  logServerStartup(port: number) {
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

  logPm2Action(action: AuditAction, processId?: number | string, details?: string, success: boolean = true) {
    this.logAudit({
      action,
      resource: AuditResource.PM2,
      details: details || `${action.replace('PM2_', '').toLowerCase()} ${processId ? `process ${processId}` : ''}`,
      isSuccess: success,
    });
  }

  logWebSocketConnectAttempt(ip: string) {
    this.logAudit({
      action: AuditAction.WEBSOCKET_CONNECT_ATTEMPT,
      resource: AuditResource.WEBSOCKET,
      details: `Connection attempt from IP: ${ip}`,
      ipAddress: ip,
      isSuccess: true,
    });
  }

  logWebSocketAuthSuccess(ip: string) {
    this.logAudit({
      action: AuditAction.WEBSOCKET_AUTH_SUCCESS,
      resource: AuditResource.WEBSOCKET,
      details: `Authenticated connection from IP: ${ip}`,
      ipAddress: ip,
      isSuccess: true,
    });
  }

  logWebSocketAuthFailure(ip: string, token?: string) {
    this.logAudit({
      action: AuditAction.WEBSOCKET_AUTH_FAILURE,
      resource: AuditResource.WEBSOCKET,
      details: `Authentication failed from IP: ${ip}`,
      ipAddress: ip,
      metadata: { tokenPrefix: token?.substring(0, 10) },
      isSuccess: false,
    });
  }

  logConsoleCommand(command: string, success: boolean = true) {
    this.logAudit({
      action: AuditAction.CONSOLE_COMMAND,
      resource: AuditResource.CONSOLE,
      details: `Executed command: ${command}`,
      metadata: { command },
      isSuccess: success,
    });
  }

  logSystemError(error: string, context: string) {
    this.logAudit({
      action: AuditAction.SYSTEM_ERROR,
      resource: AuditResource.SYSTEM,
      details: `${context}: ${error}`,
      metadata: { error },
      isSuccess: false,
    });
  }

  // Log to console only, not to file (for high-frequency WS messages)
  logConsoleOnly(message: string, context: string = 'Application') {
    Logger.log(message, context);
  }

  logWebSocketMessage(clientId: string, clientName: string | undefined, command: string) {
    this.logConsoleOnly(
      `WS Message from client ${clientName || clientId}: command ${command}`,
      'WebSocket'
    );
  }

  logWebSocketDisconnect(clientId: string, clientName: string | undefined, activeConnections: number) {
    this.logAudit({
      action: AuditAction.WEBSOCKET_DISCONNECT,
      resource: AuditResource.WEBSOCKET,
      details: `Connection closed. Client: ${clientName || clientId}. Total active connections: ${activeConnections}`,
      isSuccess: true,
    });
  }

  logWebSocketAuthenticated(clientId: string, clientName: string | undefined, activeConnections: number) {
    this.logAudit({
      action: AuditAction.WEBSOCKET_AUTH_SUCCESS,
      resource: AuditResource.WEBSOCKET,
      details: `Client authenticated. Client: ${clientName || clientId}. Total active connections: ${activeConnections}`,
      isSuccess: true,
    });
  }
}
