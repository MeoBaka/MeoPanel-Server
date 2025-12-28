import { OnModuleInit } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
export declare class Pm2Service implements OnModuleInit {
    private auditlogService;
    constructor(auditlogService: AuditlogService);
    onModuleInit(): Promise<void>;
    getProcessList(): Promise<any[]>;
    startProcess(script: string, name?: string): Promise<any>;
    stopProcess(id: number): Promise<any>;
    restartProcess(id: number): Promise<any>;
    deleteProcess(id: number): Promise<any>;
    multiStart(processes: {
        script: string;
        name?: string;
    }[]): Promise<any[]>;
    multiStop(ids: number[]): Promise<any[]>;
    multiRestart(ids: number[]): Promise<any[]>;
    multiDelete(ids: number[]): Promise<any[]>;
    resurrect(): Promise<any>;
    save(): Promise<any>;
    getLogs(id: number, lines?: number): Promise<{
        logs: string[];
        logFile: string;
    }>;
    sendSignal(id: number, signal: string): Promise<any>;
    sendData(id: number, data: string): Promise<any>;
}
