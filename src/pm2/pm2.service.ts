import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuditlogService } from '../auditlog/auditlog.service';
import { ConsoleService } from '../console/console.service';
import pm2 from 'pm2';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class Pm2Service implements OnModuleInit {
  private notesFile = path.join(process.env.ROOT_DIR || './meopanel/data', 'pm2', 'notes.json');
  private notes: Record<string, Record<string, string>> = {};

  constructor(private auditlogService: AuditlogService, private consoleService: ConsoleService) {}

  private loadNotes() {
    try {
      if (fs.existsSync(this.notesFile)) {
        const data = fs.readFileSync(this.notesFile, 'utf8');
        this.notes = JSON.parse(data);
      } else {
        this.notes = {};
      }
    } catch (error) {
      this.auditlogService.logError('Failed to load PM2 notes', 'PM2', error);
      this.notes = {};
    }
  }

  private saveNotes() {
    try {
      const dir = path.dirname(this.notesFile);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.notesFile, JSON.stringify(this.notes, null, 2));
    } catch (error) {
      this.auditlogService.logError('Failed to save PM2 notes', 'PM2', error);
    }
  }

  getNotes(serverId: string): Record<string, string> {
    return this.notes[serverId] || {};
  }

  setNote(serverId: string, processName: string, note: string) {
    if (!this.notes[serverId]) {
      this.notes[serverId] = {};
    }
    this.notes[serverId][processName] = note;
    this.saveNotes();
  }

  async onModuleInit() {
    this.loadNotes();
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
          this.auditlogService.logError(
            'Failed to get PM2 process list',
            'PM2',
            err,
          );
          reject(err);
          return;
        }

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
          this.auditlogService.logError(
            'Failed to start PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }

        this.auditlogService.logInfo(
          'PM2',
          `Started process: ${name || script}`,
        );
        resolve(proc);
      });
    });
  }

  async stopProcess(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.stop(id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to stop PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Stopped process: ${id}`);
        resolve(proc);
      });
    });
  }

  async restartProcess(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.restart(id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to restart PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Restarted process: ${id}`);
        resolve(proc);
      });
    });
  }

  async deleteProcess(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.delete(id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to delete PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }

        this.auditlogService.logInfo('PM2', `Deleted process: ${id}`);
        resolve(proc);
      });
    });
  }

  async multiStart(
    processes: { script: string; name?: string }[],
  ): Promise<any[]> {
    const promises = processes.map((proc) =>
      this.startProcess(proc.script, proc.name),
    );
    return Promise.all(promises);
  }

  async multiStop(ids: number[]): Promise<any[]> {
    const promises = ids.map((id) => this.stopProcess(id));
    return Promise.all(promises);
  }

  async multiRestart(ids: number[]): Promise<any[]> {
    const promises = ids.map((id) => this.restartProcess(id));
    return Promise.all(promises);
  }

  async multiDelete(ids: number[]): Promise<any[]> {
    const promises = ids.map((id) => this.deleteProcess(id));
    return Promise.all(promises);
  }

  async resurrect(): Promise<any> {
    return new Promise((resolve, reject) => {
      (pm2 as any).resurrect((err) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to resurrect PM2 processes',
            'PM2',
            err,
          );
          reject(err);
          return;
        }
        this.auditlogService.logInfo('PM2', 'Resurrected processes');
        resolve({});
      });
    });
  }

  async save(): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.dump((err) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to save PM2 processes',
            'PM2',
            err,
          );
          reject(err);
          return;
        }
        this.auditlogService.logInfo('PM2', 'Saved PM2 processes');
        resolve({});
      });
    });
  }

  async getLogs(id: number, lines: number = 200): Promise<{ logs: string[], logFile: string }> {
    return new Promise((resolve, reject) => {
      pm2.describe(id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to describe PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }
        if (!proc || proc.length === 0) {
          reject(new Error('Process not found'));
          return;
        }
        const pm2Env = proc[0].pm2_env;
        if (!pm2Env) {
          reject(new Error('PM2 env not found'));
          return;
        }
        const logFile = pm2Env.pm_out_log_path || (pm2Env as any).pm_log_path;
        if (!logFile) {
          reject(new Error('Log file not found'));
          return;
        }
        const fs = require('fs');
        fs.readFile(logFile, 'utf8', (err, data) => {
          if (err) {
            reject(err);
            return;
          }
          const linesArray = data.split('\n').filter((line) => line.trim());
          const lastLines = linesArray.slice(-lines);
          resolve({ logs: lastLines, logFile });
        });
      });
    });
  }

  async sendSignal(id: number, signal: string): Promise<any> {
    return new Promise((resolve, reject) => {
      (pm2 as any).sendSignalToProcessName(signal, id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to send signal to PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }
        this.auditlogService.logInfo(
          'PM2',
          `Sent signal ${signal} to process: ${id}`,
        );
        resolve(proc);
      });
    });
  }

  async sendData(id: number, data: string): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.describe(id, (err, proc) => {
        if (err) {
          this.auditlogService.logError(
            'Failed to describe PM2 process',
            'PM2',
            err,
          );
          reject(err);
          return;
        }
        if (!proc || proc.length === 0) {
          reject(new Error('Process not found'));
          return;
        }
        const pm2Env = proc[0].pm2_env;
        if (!pm2Env) {
          reject(new Error('PM2 env not found'));
          return;
        }
        const pmId = proc[0].pm_id;
        if (!pmId) {
          reject(new Error('PM2 process ID not found'));
          return;
        }
        if (pm2Env.status !== 'online') {
          reject(new Error(`Process is not online (status: ${pm2Env.status})`));
          return;
        }
        const { spawn } = require('child_process');
        const pm2Process = spawn('pm2', ['send', pmId.toString(), data], { shell: true });

        let stdout = '';
        let stderr = '';

        pm2Process.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        pm2Process.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        pm2Process.on('close', (code) => {
          if (code === 0) {
            this.auditlogService.logInfo(
              'PM2',
              `Executed pm2 send command successfully: pm2 send ${pmId} "${data}"`,
            );
            resolve({ stdout, stderr });
          } else {
            reject(new Error(`pm2 send failed with code ${code}: ${stderr}`));
          }
        });

        pm2Process.on('error', (error) => {
          reject(error);
        });
      });
    });
  }
}
