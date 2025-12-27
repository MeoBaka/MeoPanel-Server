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

@WebSocketGateway()
export class WsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

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
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const processList = await this.pm2Service.getProcessList();
              client.send(JSON.stringify({
                type: 'pm2-list',
                data: processList,
              }));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to get PM2 process list',
                error: error.message,
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for PM2 command',
            }));
          }
        }

        // PM2 start command
        else if (data.command === 'pm2-start') {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.startProcess(data.script, data.name);
              client.send(JSON.stringify({
                type: 'pm2-start',
                data: result,
              }));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to start PM2 process',
                error: error.message,
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for PM2 command',
            }));
          }
        }

        // PM2 stop command
        else if (data.command === 'pm2-stop') {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.stopProcess(data.name);
              client.send(JSON.stringify({
                type: 'pm2-stop',
                data: result,
              }));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to stop PM2 process',
                error: error.message,
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for PM2 command',
            }));
          }
        }

        // PM2 restart command
        else if (data.command === 'pm2-restart') {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.restartProcess(data.name);
              client.send(JSON.stringify({
                type: 'pm2-restart',
                data: result,
              }));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to restart PM2 process',
                error: error.message,
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for PM2 command',
            }));
          }
        }

        // PM2 delete command
        else if (data.command === 'pm2-delete') {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const result = await this.pm2Service.deleteProcess(data.name);
              client.send(JSON.stringify({
                type: 'pm2-delete',
                data: result,
              }));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to delete PM2 process',
                error: error.message,
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for PM2 command',
            }));
          }
        }

        // Status update command
        else if (data.command === 'status') {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            try {
              const connectData = await this.connectService.connect();
              client.send(JSON.stringify(connectData));
            } catch (error) {
              client.send(JSON.stringify({
                type: 'error',
                message: 'Failed to get server status',
              }));
            }
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token for status command',
            }));
          }
        }

        // Legacy connect command
        else if (data.uuid && data.token) {
          const isAuthenticated = await this.meoGuard.validateMessageCredentials(data.token, data.uuid);
          if (isAuthenticated) {
            const connectData = await this.connectService.connect();
            client.send(JSON.stringify(connectData));
          } else {
            client.send(JSON.stringify({
              type: 'error',
              message: 'Unauthorized: Invalid UUID or token',
            }));
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
    // Handle disconnect if needed
  }
}
