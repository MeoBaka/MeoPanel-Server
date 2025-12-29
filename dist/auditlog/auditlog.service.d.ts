import { ConfigService } from '@nestjs/config';
import 'winston-daily-rotate-file';
export declare class AuditlogService {
    private configService;
    private logger;
    constructor(configService: ConfigService);
    logError(message: string, context?: string, error?: unknown): void;
    logInfo(context: string, message: string): void;
    logWarn(message: string, context: string): void;
}
