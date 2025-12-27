import { WebSocketGateway, OnGatewayConnection, OnGatewayDisconnect, WebSocketServer } from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';
import { PingService } from '../ping/ping.service';
import { ConnectService } from '../connect/connect.service';
import * as fs from 'fs';
import * as path from 'path';
import { randomUUID } from 'crypto';

@WebSocketGateway()
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
  @WebSocketServer()
  server: Server;

  private connectData: any;

  constructor(
    private readonly pingService: PingService,
    private readonly connectService: ConnectService,
  ) {}

  onModuleInit() {
    const filePath = path.join(__dirname, '../../connect.json');
    if (fs.existsSync(filePath)) {
      this.connectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      if (!this.connectData.uuid || !this.connectData.token) {
        this.generateConnectData(filePath);
      }
    } else {
      this.generateConnectData(filePath);
    }
  }

  private generateConnectData(filePath: string) {
    this.connectData = {
      uuid: randomUUID(),
      token: randomUUID().replace(/-/g, ''),
    };
    fs.writeFileSync(filePath, JSON.stringify(this.connectData, null, 2));
  }

  handleConnection(client: any) {
    client.on('message', (message: Buffer) => {
      const msg = message.toString();
      try {
        const data = JSON.parse(msg);
        if (data.uuid === this.connectData.uuid && data.token === this.connectData.token) {
          client.send(JSON.stringify(this.connectService.connect()));
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