import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
export declare class MeoGuard implements CanActivate {
    private auditlogService;
    private connectData;
    constructor(auditlogService: AuditlogService);
    private loadConnectData;
    canActivate(context: ExecutionContext): Promise<boolean>;
    validateMessageCredentials(token: string, uuid: string): Promise<boolean>;
    private validateCredentials;
}
