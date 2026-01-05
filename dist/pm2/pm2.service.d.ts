import { OnModuleInit } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
import { ConsoleService } from '../console/console.service';
export declare class Pm2Service implements OnModuleInit {
    private auditlogService;
    private consoleService;
    private notesFile;
    private notes;
    constructor(auditlogService: AuditlogService, consoleService: ConsoleService);
    private loadNotes;
    private saveNotes;
    getNotes(serverId: string): Record<string, string>;
    setNote(serverId: string, processName: string, note: string): void;
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
    getProcessCwd(id: number): Promise<string>;
    listFiles(id: number, relativePath?: string): Promise<any[]>;
    readFile(id: number, relativePath: string): Promise<string>;
    writeFile(id: number, relativePath: string, content: string): Promise<void>;
    createFile(id: number, relativePath: string, content?: string): Promise<void>;
    createFolder(id: number, relativePath: string): Promise<void>;
    deleteFile(id: number, relativePath: string): Promise<void>;
    renameFile(id: number, oldPath: string, newName: string): Promise<void>;
    moveFile(id: number, sourcePath: string, destinationPath: string): Promise<void>;
    pasteFiles(id: number, clipboard: {
        type: 'cut' | 'copy';
        files: any[];
    }, destinationPath: string): Promise<void>;
    zipFiles(id: number, filePaths: string[], zipName: string, onProgress?: (progress: number) => void): Promise<void>;
    unzipFile(id: number, zipPath: string, destinationPath: string): Promise<void>;
    uploadFile(id: number, relativePath: string, fileData: string, fileName: string): Promise<void>;
    downloadFile(id: number, relativePath: string): Promise<{
        data: string;
        fileName: string;
    }>;
}
