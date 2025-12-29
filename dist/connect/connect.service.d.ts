import { Pm2Service } from '../pm2/pm2.service';
export declare class ConnectService {
    private readonly pm2Service;
    constructor(pm2Service: Pm2Service);
    connect(): Promise<any>;
    private getCpuUsage;
    private getDiskSpace;
    private parseSize;
    private getAvailableDiskSpace;
    private getFolderSize;
    private formatBytes;
    private getPm2Stats;
    private getInstances;
    private getPlatform;
}
