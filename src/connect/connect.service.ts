import { Injectable } from '@nestjs/common';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ConnectService {
  connect(): any {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;

    const cpus = os.cpus();
    const cpuUsage = cpus.length; // Number of CPUs

    // Disk space
    const diskSpace = this.getDiskSpace();

    // Instances - placeholder, need to implement based on your app
    const instances = this.getInstances();

    const platform = this.getPlatform();
    const version = {
      node: process.version,
      server: process.env.VERSION || '1.0.0',
    };

    const host = process.env.HWSHOST || 'localhost';
    const port = process.env.HWSPORT || 3000;

    return {
      connection_address: `ws://${host}:${port}`,
      memory: {
        total: totalMemory,
        used: usedMemory,
        free: freeMemory,
      },
      cpu: cpuUsage,
      disk_space: {
        used: diskSpace.used,
        max: diskSpace.max,
        allow: diskSpace.allow,
      },
      total_instances: instances.total,
      running_instances: instances.running,
      stopped_instances: instances.stopped,
      platform,
      version,
    };
  }

  private getDiskSpace(): { allow: number; used: number; max: number } {
    const diskSpaceStr = process.env.DISK_SPACE || '100GB';
    const maxBytes = this.parseSize(diskSpaceStr);

    // Check available space
    const available = this.getAvailableDiskSpace();
    if (available < maxBytes) {
      console.warn(
        `Warning: Available disk space (${this.formatBytes(available)}) is less than required (${diskSpaceStr})`,
      );
    }

    // Calculate used space in meopanel dirs
    const rootDir = process.env.ROOT_DIR || '/meopanel/data';
    const logDir = process.env.LOG_DIR || '/meopanel/logs';
    const instanceDir = process.env.INSTANCE_DIR || '/meopanel/instances';
    const used =
      this.getFolderSize(rootDir) +
      this.getFolderSize(logDir) +
      this.getFolderSize(instanceDir);

    return {
      allow: maxBytes,
      used,
      max: maxBytes,
    };
  }

  private parseSize(sizeStr: string): number {
    const match = sizeStr.match(/^(\d+)(GB|MB|KB|B)?$/i);
    if (!match) return 100 * 1024 * 1024 * 1024; // Default 100GB
    const num = parseInt(match[1]);
    const unit = match[2]?.toUpperCase();
    switch (unit) {
      case 'GB':
        return num * 1024 * 1024 * 1024;
      case 'MB':
        return num * 1024 * 1024;
      case 'KB':
        return num * 1024;
      default:
        return num;
    }
  }

  private getAvailableDiskSpace(): number {
    try {
      if (os.platform() === 'win32') {
        // For Windows, use a simple check or placeholder
        return 100 * 1024 * 1024 * 1024; // Placeholder
      } else {
        // For Linux, read /proc/diskstats or use df
        // Placeholder
        return 200 * 1024 * 1024 * 1024;
      }
    } catch {
      return 100 * 1024 * 1024 * 1024;
    }
  }

  private getFolderSize(folderPath: string): number {
    let totalSize = 0;
    try {
      const files = fs.readdirSync(folderPath);
      for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          totalSize += this.getFolderSize(filePath);
        } else {
          totalSize += stat.size;
        }
      }
    } catch {
      // Ignore errors
    }
    return totalSize;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  private getInstances(): { total: number; running: number; stopped: number } {
    // Placeholder - implement based on your instance management
    return {
      total: 0,
      running: 0,
      stopped: 0,
    };
  }

  private getPlatform(): string {
    const platform = os.platform();
    if (platform === 'win32') {
      return 'windows';
    } else if (platform === 'linux') {
      try {
        const osRelease = fs.readFileSync('/etc/os-release', 'utf-8');
        const idMatch = osRelease.match(/^ID=(.*)$/m);
        if (idMatch) {
          return idMatch[1].replace(/"/g, '');
        }
      } catch {
        // Fallback
      }
      return 'linux';
    } else if (platform === 'darwin') {
      return 'macos';
    }
    return platform;
  }
}
