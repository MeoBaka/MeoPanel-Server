import { OnModuleInit } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
export declare class Pm2Service implements OnModuleInit {
    private auditlogService;
    constructor(auditlogService: AuditlogService);
    onModuleInit(): Promise<void>;
    getProcessList(): Promise<any[]>;
    startProcess(script: string, name?: string): Promise<any>;
    stopProcess(name: string): Promise<any>;
    restartProcess(name: string): Promise<any>;
    deleteProcess(name: string): Promise<any>;
}
