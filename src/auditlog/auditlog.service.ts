import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as winston from 'winston';
import 'winston-daily-rotate-file';
import * as path from 'path';
import * as fs from 'fs';

@Injectable()
export class AuditlogService {
  private logger: winston.Logger;

  constructor(private configService: ConfigService) {
    const logDir = this.configService?.get<string>('LOG_DIR') || process.env.LOG_DIR || './meopanel/logs';

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
}
