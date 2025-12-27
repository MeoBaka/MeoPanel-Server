import { ArgumentsHost, ExceptionFilter } from '@nestjs/common';
import { AuditlogService } from './auditlog.service';
export declare class AuditlogExceptionFilter implements ExceptionFilter {
    private readonly auditlogService;
    constructor(auditlogService: AuditlogService);
    catch(exception: any, host: ArgumentsHost): void;
}
