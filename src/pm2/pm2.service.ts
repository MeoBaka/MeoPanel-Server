import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
import pm2 from 'pm2';

@Injectable()
export class Pm2Service implements OnModuleInit {
  constructor(private auditlogService: AuditlogService) {}

  async onModuleInit() {
    return new Promise<void>((resolve, reject) => {
      pm2.connect((err) => {
        if (err) {
          this.auditlogService.logError('Failed to connect to PM2', 'PM2', err);
          reject(err);
          return;
        }
        this.auditlogService.logInfo('PM2', 'Connected to PM2');
        resolve();
      });
    });
  }

  async getProcessList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      pm2.list((err, processList) => {
        if (err) {
          this.auditlogService.logError('Failed to get PM2 process list', 'PM2', err);
          reject(err);
          return;
        }

        // Log successful retrieval
        this.auditlogService.logInfo('PM2', `Retrieved ${processList.length} processes`);

        resolve(processList);
      });
    });
  }

  async startProcess(script: string, name?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        script,
        name: name || script,
      };

      pm2.start(options, (err, proc) => {
        if (err) {
          this.auditlogService.logError('Failed to start PM2 process', 'PM2', err);
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Started process: ${name || script}`);
        resolve(proc);
      });
    });
  }

  async stopProcess(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.stop(name, (err, proc) => {
        if (err) {
          this.auditlogService.logError('Failed to stop PM2 process', 'PM2', err);
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Stopped process: ${name}`);
        resolve(proc);
      });
    });
  }

  async restartProcess(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.restart(name, (err, proc) => {
        if (err) {
          this.auditlogService.logError('Failed to restart PM2 process', 'PM2', err);
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Restarted process: ${name}`);
        resolve(proc);
      });
    });
  }

  async deleteProcess(name: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.delete(name, (err, proc) => {
        if (err) {
          this.auditlogService.logError('Failed to delete PM2 process', 'PM2', err);
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Deleted process: ${name}`);
        resolve(proc);
      });
    });
  }
}