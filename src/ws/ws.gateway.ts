import {
  WebSocketGateway,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketServer,
} from '@nestjs/websockets';
import { UseGuards } from '@nestjs/common';
import { Server } from 'ws';
import { PingService } from '../ping/ping.service';
import { ConnectService } from '../connect/connect.service';
import { Pm2Service } from '../pm2/pm2.service';
import { MeoGuard } from '../meoguard/meoguard.guard';

const fs = require('fs');

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logWatchers: Map<string, { logFile: string, lastSize: number }> = new Map();

  constructor(
    private readonly pingService: PingService,
    private readonly connectService: ConnectService,
    private readonly pm2Service: Pm2Service,
    private readonly meoGuard: MeoGuard,
  ) {}

  handleConnection(client: any) {
    client.on('message', async (message: Buffer) => {
      const msg = message.toString();
      try {
        const data = JSON.parse(msg);

        // Handle PM2 commands
        if (data.command === 'pm2-list') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const processList = await this.pm2Service.getProcessList();
              client.send(
                JSON.stringify({
                  type: 'pm2-list',
                  data: processList,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to get PM2 process list',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 start command
        else if (data.command === 'pm2-start') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.startProcess(
                data.script,
                data.name,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-start',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to start PM2 process',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 stop command
        else if (data.command === 'pm2-stop') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.stopProcess(parseInt(data.id));
              client.send(
                JSON.stringify({
                  type: 'pm2-stop',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to stop PM2 process',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 restart command
        else if (data.command === 'pm2-restart') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.restartProcess(parseInt(data.id));
              client.send(
                JSON.stringify({
                  type: 'pm2-restart',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to restart PM2 process',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 delete command
        else if (data.command === 'pm2-delete') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.deleteProcess(parseInt(data.id));
              client.send(
                JSON.stringify({
                  type: 'pm2-delete',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to delete PM2 process',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 multi-start command
        else if (data.command === 'pm2-multi-start') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.multiStart(data.processes);
              client.send(
                JSON.stringify({
                  type: 'pm2-multi-start',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to start multiple PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 multi-stop command
        else if (data.command === 'pm2-multi-stop') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.multiStop(data.ids.map(id => parseInt(id)));
              client.send(
                JSON.stringify({
                  type: 'pm2-multi-stop',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to stop multiple PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 multi-restart command
        else if (data.command === 'pm2-multi-restart') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.multiRestart(data.ids.map(id => parseInt(id)));
              client.send(
                JSON.stringify({
                  type: 'pm2-multi-restart',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to restart multiple PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 multi-delete command
        else if (data.command === 'pm2-multi-delete') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.multiDelete(data.ids.map(id => parseInt(id)));
              client.send(
                JSON.stringify({
                  type: 'pm2-multi-delete',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to delete multiple PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 resurrect command
        else if (data.command === 'pm2-resurrect') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.resurrect();
              client.send(
                JSON.stringify({
                  type: 'pm2-resurrect',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to resurrect PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 save command
        else if (data.command === 'pm2-save') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.save();
              client.send(
                JSON.stringify({
                  type: 'pm2-save',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to save PM2 processes',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 logs command
        else if (data.command === 'pm2-logs') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.getLogs(
                parseInt(data.id),
                data.lines || 200,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-logs',
                  data: result.logs,
                }),
              );
              const watcherKey = `${client.id}-${data.id}`;
              // Stop any existing watcher for this client-process pair
              const existing = this.logWatchers.get(watcherKey);
              if (existing) {
                fs.unwatchFile(existing.logFile);
                this.logWatchers.delete(watcherKey);
              }
              // Set up watcher
              let lastSize = fs.statSync(result.logFile).size;
              fs.watchFile(result.logFile, { interval: 1000 }, (curr, prev) => {
                if (curr.size > lastSize) {
                  const stream = fs.createReadStream(result.logFile, { start: lastSize, end: curr.size - 1, encoding: 'utf8' });
                  let newData = '';
                  stream.on('data', (chunk) => {
                    newData += chunk;
                  });
                  stream.on('end', () => {
                    const newLines = newData.split('\n').filter(line => line.trim());
                    if (newLines.length > 0) {
                      client.send(JSON.stringify({
                        type: 'pm2-logs',
                        data: newLines,
                      }));
                    }
                    lastSize = curr.size;
                  });
                }
              });
              this.logWatchers.set(watcherKey, { logFile: result.logFile, lastSize });
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to get PM2 logs',
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }


        // PM2 send command
        else if (data.command === 'pm2-send') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.sendData(
                parseInt(data.id),
                data.data,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-send',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: `Failed to send data to PM2 process: ${error.message}`,
                  error: error.message,
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token for PM2 command',
              }),
            );
          }
        }

        // PM2 stop logs command
        else if (data.command === 'pm2-stop-logs') {
          const watcherKey = `${client.id}-${data.id}`;
          const entry = this.logWatchers.get(watcherKey);
          if (entry) {
            fs.unwatchFile(entry.logFile);
            this.logWatchers.delete(watcherKey);
          }
        }

        // Status update command
        else if (data.command === 'status') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const connectData = await this.connectService.connect();
              client.send(JSON.stringify(connectData));
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to get server status',
                }),
              );
            }
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message:
                  'Unauthorized: Invalid UUID or token for status command',
              }),
            );
          }
        }

        // Legacy connect command
        else if (data.uuid && data.token) {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            const connectData = await this.connectService.connect();
            client.send(JSON.stringify(connectData));
          } else {
            client.send(
              JSON.stringify({
                type: 'error',
                message: 'Unauthorized: Invalid UUID or token',
              }),
            );
          }
        }
      } catch {
        if (msg === 'ping') {
          client.send(JSON.stringify(this.pingService.ping()));
        }
      }
    });
  }

  handleDisconnect(client: any) {
    // Clean up all log watchers for this client
    for (const [key, entry] of this.logWatchers.entries()) {
      if (key.startsWith(`${client.id}-`)) {
        fs.unwatchFile(entry.logFile);
        this.logWatchers.delete(key);
      }
    }
  }
}
