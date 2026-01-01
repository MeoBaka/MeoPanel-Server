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
import { AuditlogService } from '../auditlog/auditlog.service';

const fs = require('fs');

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private logWatchers: Map<string, { logFile: string, lastSize: number }> = new Map();
  private listWatchers: Map<string, { interval: NodeJS.Timeout, lastList: string }> = new Map();
  private statusWatchers: Map<string, { interval: NodeJS.Timeout, lastStatus: string }> = new Map();
  private activeConnections: number = 0;
  private clientCounter: number = 0;

  constructor(
    private readonly pingService: PingService,
    private readonly connectService: ConnectService,
    private readonly pm2Service: Pm2Service,
    private readonly meoGuard: MeoGuard,
    private readonly auditlogService: AuditlogService,
  ) {}

  handleConnection(client: any) {
    client.id = `ws_${++this.clientCounter}`;
    this.activeConnections++;
    // Connection established log removed - will log on authentication

    client.on('message', async (message: Buffer) => {
      const msg = message.toString();
      try {
        const data = JSON.parse(msg);

        if (data.command) {
          this.auditlogService.logWebSocketMessage(client.id, client.clientName, data.command);
        }

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
              const listKey = `${client.id}-pm2-list`;
              const listString = JSON.stringify(processList);

              // Stop any existing watcher
              const existing = this.listWatchers.get(listKey);
              if (existing) {
                clearInterval(existing.interval);
                this.listWatchers.delete(listKey);
              }

              // Send initial data
              client.send(
                JSON.stringify({
                  type: 'pm2-list',
                  data: processList,
                  timestamp: data.timestamp,
                }),
              );

              // Set up realtime updates
              let lastPingTime = Date.now();
              const interval = setInterval(async () => {
                try {
                  const newList = await this.pm2Service.getProcessList();
                  const newListString = JSON.stringify(newList);
                  const watcher = this.listWatchers.get(listKey);
                  const now = Date.now();
                  if (watcher && (newListString !== watcher.lastList || now - lastPingTime > 5000)) {
                    client.send(
                      JSON.stringify({
                        type: 'pm2-list',
                        data: newList,
                        timestamp: now,
                      }),
                    );
                    // Update the stored list for comparison
                    watcher.lastList = newListString;
                    lastPingTime = now;
                  }
                } catch (error) {
                  // Ignore errors in interval
                }
              }, 1000); // Check every 1 second

              this.listWatchers.set(listKey, { interval, lastList: listString });
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

        // PM2 list files command
        else if (data.command === 'pm2-list-files') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.listFiles(
                parseInt(data.id),
                data.relativePath || '',
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-list-files',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to list files',
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

        // PM2 read file command
        else if (data.command === 'pm2-read-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.readFile(
                parseInt(data.id),
                data.relativePath,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-read-file',
                  data: result,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to read file',
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

        // PM2 write file command
        else if (data.command === 'pm2-write-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.writeFile(
                parseInt(data.id),
                data.relativePath,
                data.content,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-write-file',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to write file',
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

        // PM2 create file command
        else if (data.command === 'pm2-create-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.createFile(
                parseInt(data.id),
                data.relativePath,
                data.content || '',
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-create-file',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to create file',
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

        // PM2 create folder command
        else if (data.command === 'pm2-create-folder') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.createFolder(
                parseInt(data.id),
                data.relativePath,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-create-folder',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to create folder',
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

        // PM2 delete files command
        else if (data.command === 'pm2-delete-files') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              for (const filePath of data.filePaths) {
                await this.pm2Service.deleteFile(
                  parseInt(data.id),
                  filePath,
                );
              }
              client.send(
                JSON.stringify({
                  type: 'pm2-delete-files',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to delete files',
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

        // PM2 rename file command
        else if (data.command === 'pm2-rename-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.renameFile(
                parseInt(data.id),
                data.oldPath,
                data.newName,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-rename-file',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to rename file',
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

        // PM2 move file command
        else if (data.command === 'pm2-move-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.moveFile(
                parseInt(data.id),
                data.sourcePath,
                data.destinationPath,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-move-file',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to move file',
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

        // PM2 paste files command
        else if (data.command === 'pm2-paste-files') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.pasteFiles(
                parseInt(data.id),
                data.clipboard,
                data.destinationPath,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-paste-files',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to paste files',
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

        // PM2 zip files command
        else if (data.command === 'pm2-zip-files') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.zipFiles(
                parseInt(data.id),
                data.filePaths,
                data.zipName,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-zip-files',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to zip files',
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

        // PM2 unzip file command
        else if (data.command === 'pm2-unzip-file') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              await this.pm2Service.unzipFile(
                parseInt(data.id),
                data.zipPath,
                data.destinationPath,
              );
              client.send(
                JSON.stringify({
                  type: 'pm2-unzip-file',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to unzip file',
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

        // PM2 stop list command
        else if (data.command === 'pm2-stop-list') {
          const listKey = `${client.id}-pm2-list`;
          const entry = this.listWatchers.get(listKey);
          if (entry) {
            clearInterval(entry.interval);
            this.listWatchers.delete(listKey);
          }
        }

        // Status stop command
        else if (data.command === 'status-stop') {
          const statusKey = `${client.id}-status`;
          const entry = this.statusWatchers.get(statusKey);
          if (entry) {
            clearInterval(entry.interval);
            this.statusWatchers.delete(statusKey);
          }
        }

        // PM2 notes get command
        else if (data.command === 'pm2-notes-get') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              const notes = this.pm2Service.getNotes(data.uuid);
              client.send(
                JSON.stringify({
                  type: 'pm2-notes-get',
                  data: notes,
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to get PM2 notes',
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

        // PM2 notes set command
        else if (data.command === 'pm2-notes-set') {
          const isAuthenticated =
            await this.meoGuard.validateMessageCredentials(
              data.token,
              data.uuid,
            );
          if (isAuthenticated) {
            try {
              this.pm2Service.setNote(data.uuid, data.process_name, data.note);
              client.send(
                JSON.stringify({
                  type: 'pm2-notes-set',
                  data: { success: true },
                }),
              );
            } catch (error) {
              client.send(
                JSON.stringify({
                  type: 'error',
                  message: 'Failed to set PM2 note',
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
              const statusKey = `${client.id}-status`;
              const statusString = JSON.stringify(connectData);

              // Stop any existing watcher
              const existing = this.statusWatchers.get(statusKey);
              if (existing) {
                clearInterval(existing.interval);
                this.statusWatchers.delete(statusKey);
              }

              // Send initial data
              client.send(
                JSON.stringify({
                  type: 'status',
                  data: connectData,
                  timestamp: data.timestamp,
                }),
              );

              // Set up realtime updates
              const interval = setInterval(async () => {
                try {
                  const newStatus = await this.connectService.connect();
                  const newStatusString = JSON.stringify(newStatus);
                  const watcher = this.statusWatchers.get(statusKey);
                  if (watcher && newStatusString !== watcher.lastStatus) {
                    client.send(
                      JSON.stringify({
                        type: 'status',
                        data: newStatus,
                      }),
                    );
                    // Update the stored status for comparison
                    watcher.lastStatus = newStatusString;
                  }
                } catch (error) {
                  // Ignore errors in interval
                }
              }, 1000); // Check every 1 second

              this.statusWatchers.set(statusKey, { interval, lastStatus: statusString });
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
            if (data.clientName) {
              client.clientName = data.clientName;
            }
            this.auditlogService.logWebSocketAuthenticated(client.id, client.clientName, this.activeConnections);
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
    this.activeConnections--;
    this.auditlogService.logWebSocketDisconnect(client.id, client.clientName, this.activeConnections);

    // Clean up all log watchers for this client
    for (const [key, entry] of this.logWatchers.entries()) {
      if (key.startsWith(`${client.id}-`)) {
        fs.unwatchFile(entry.logFile);
        this.logWatchers.delete(key);
      }
    }

    // Clean up all list watchers for this client
    for (const [key, entry] of this.listWatchers.entries()) {
      if (key.startsWith(`${client.id}-`)) {
        clearInterval(entry.interval);
        this.listWatchers.delete(key);
      }
    }

    // Clean up all status watchers for this client
    for (const [key, entry] of this.statusWatchers.entries()) {
      if (key.startsWith(`${client.id}-`)) {
        clearInterval(entry.interval);
        this.statusWatchers.delete(key);
      }
    }
  }
}
