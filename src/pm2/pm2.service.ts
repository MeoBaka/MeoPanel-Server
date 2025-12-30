import { Injectable, OnModuleInit } from '@nestjs/common';
import { AuditlogService, AuditAction } from '../auditlog/auditlog.service';
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
      this.auditlogService.logSystemError('Failed to load PM2 notes', 'PM2');
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
      this.auditlogService.logSystemError('Failed to save PM2 notes', 'PM2');
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
          this.auditlogService.logPm2Action(
            AuditAction.PM2_CONNECT,
            undefined,
            'Failed to connect to PM2',
            false,
          );
          reject(err);
          return;
        }
        this.auditlogService.logPm2Connect();
        resolve();
      });
    });
  }

  async getProcessList(): Promise<any[]> {
    return new Promise((resolve, reject) => {
      pm2.list((err, processList) => {
        if (err) {
          this.auditlogService.logSystemError('Failed to get PM2 process list', 'PM2');
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
          this.auditlogService.logPm2Action(
            AuditAction.PM2_START_PROCESS,
            options.name,
            `Failed to start PM2 process: ${options.name}`,
            false,
          );
          reject(err);
          return;
        }

        this.auditlogService.logPm2Action(
          AuditAction.PM2_START_PROCESS,
          name || script,
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
          this.auditlogService.logPm2Action(
            AuditAction.PM2_STOP_PROCESS,
            id,
            `Failed to stop PM2 process: ${id}`,
            false,
          );
          reject(err);
          return;
        }

        this.auditlogService.logPm2Action(
          AuditAction.PM2_STOP_PROCESS,
          id,
          `Stopped process: ${id}`,
        );
        resolve(proc);
      });
    });
  }

  async restartProcess(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.restart(id, (err, proc) => {
        if (err) {
          this.auditlogService.logPm2Action(
            AuditAction.PM2_RESTART_PROCESS,
            id,
            `Failed to restart PM2 process: ${id}`,
            false,
          );
          reject(err);
          return;
        }

        this.auditlogService.logPm2Action(
          AuditAction.PM2_RESTART_PROCESS,
          id,
          `Restarted process: ${id}`,
        );
        resolve(proc);
      });
    });
  }

  async deleteProcess(id: number): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.delete(id, (err, proc) => {
        if (err) {
          this.auditlogService.logPm2Action(
            AuditAction.PM2_DELETE_PROCESS,
            id,
            `Failed to delete PM2 process: ${id}`,
            false,
          );
          reject(err);
          return;
        }

        this.auditlogService.logPm2Action(
          AuditAction.PM2_DELETE_PROCESS,
          id,
          `Deleted process: ${id}`,
        );
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
          this.auditlogService.logPm2Action(
            AuditAction.PM2_RESURRECT,
            undefined,
            'Failed to resurrect PM2 processes',
            false,
          );
          reject(err);
          return;
        }
        this.auditlogService.logPm2Action(
          AuditAction.PM2_RESURRECT,
          undefined,
          'Resurrected processes',
        );
        resolve({});
      });
    });
  }

  async save(): Promise<any> {
    return new Promise((resolve, reject) => {
      pm2.dump((err) => {
        if (err) {
          this.auditlogService.logPm2Action(
            AuditAction.PM2_SAVE,
            undefined,
            'Failed to save PM2 processes',
            false,
          );
          reject(err);
          return;
        }
        this.auditlogService.logPm2Action(
          AuditAction.PM2_SAVE,
          undefined,
          'Saved PM2 processes',
        );
        resolve({});
      });
    });
  }

  async getLogs(id: number, lines: number = 200): Promise<{ logs: string[], logFile: string }> {
    return new Promise((resolve, reject) => {
      pm2.describe(id, (err, proc) => {
        if (err) {
          this.auditlogService.logSystemError('Failed to describe PM2 process', 'PM2');
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
          this.auditlogService.logPm2Action(
            AuditAction.PM2_SEND_SIGNAL,
            id,
            `Failed to send signal to PM2 process: ${id}`,
            false,
          );
          reject(err);
          return;
        }
        this.auditlogService.logPm2Action(
          AuditAction.PM2_SEND_SIGNAL,
          id,
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
          this.auditlogService.logSystemError('Failed to describe PM2 process for sendData', 'PM2');
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
            this.auditlogService.logPm2Action(
              AuditAction.PM2_SEND_DATA,
              pmId,
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

  async getProcessCwd(id: number): Promise<string> {
    return new Promise((resolve, reject) => {
      pm2.describe(id, (err, proc) => {
        if (err) {
          this.auditlogService.logSystemError('Failed to describe PM2 process for getProcessCwd', 'PM2');
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
        const cwd = pm2Env.pm_cwd;
        if (!cwd) {
          reject(new Error('PM2 cwd not found'));
          return;
        }
        resolve(cwd);
      });
    });
  }

  async listFiles(id: number, relativePath: string = ''): Promise<any[]> {
    const cwd = await this.getProcessCwd(id);
    const fullPath = path.resolve(cwd, relativePath);

    // Ensure the path is within the cwd
    if (!fullPath.startsWith(cwd)) {
      throw new Error('Access denied: Path outside of process directory');
    }

    return new Promise((resolve, reject) => {
      fs.readdir(fullPath, { withFileTypes: true }, (err, files) => {
        if (err) {
          reject(err);
          return;
        }
        const fileList = files.map(file => ({
          name: file.name,
          isDirectory: file.isDirectory(),
          size: file.isFile() ? fs.statSync(path.join(fullPath, file.name)).size : 0,
          modified: file.isFile() ? fs.statSync(path.join(fullPath, file.name)).mtime : null,
        }));
        resolve(fileList);
      });
    });
  }

  async readFile(id: number, relativePath: string): Promise<string> {
    const cwd = await this.getProcessCwd(id);
    const fullPath = path.resolve(cwd, relativePath);

    // Ensure the path is within the cwd
    if (!fullPath.startsWith(cwd)) {
      throw new Error('Access denied: Path outside of process directory');
    }

    return new Promise((resolve, reject) => {
      fs.readFile(fullPath, 'utf8', (err, data) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(data);
      });
    });
  }

  async writeFile(id: number, relativePath: string, content: string): Promise<void> {
    const cwd = await this.getProcessCwd(id);
    const fullPath = path.resolve(cwd, relativePath);

    // Ensure the path is within the cwd
    if (!fullPath.startsWith(cwd)) {
      throw new Error('Access denied: Path outside of process directory');
    }

    return new Promise((resolve, reject) => {
      fs.writeFile(fullPath, content, 'utf8', (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}
