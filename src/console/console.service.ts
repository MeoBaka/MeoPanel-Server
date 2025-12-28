import { Injectable } from '@nestjs/common';
import { spawn } from 'child_process';

@Injectable()
export class ConsoleService {
  async sendToProcess(id: string, data: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const pm2 = spawn('pm2', ['send', id, data], { shell: true });

      let stdout = '';
      let stderr = '';

      pm2.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      pm2.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      pm2.on('close', (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(stderr || `Process exited with code ${code}`));
        }
      });

      pm2.on('error', (error) => {
        reject(error);
      });
    });
  }
}