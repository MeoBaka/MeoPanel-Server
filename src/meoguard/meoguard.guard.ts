import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { AuditlogService } from '../auditlog/auditlog.service';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MeoGuard implements CanActivate {
  private connectData: any;

  constructor(private auditlogService: AuditlogService) {
    this.loadConnectData();
  }

  private loadConnectData() {
    const filePath = path.join(__dirname, '../../connect.json');
    if (fs.existsSync(filePath)) {
      this.connectData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const client = context.switchToWs().getClient();
    const request = client.handshake;

    const token = request.query.token as string;
    const uuid = request.query.uuid as string;
    const ip = request.connection.remoteAddress || request.socket.remoteAddress;

    // Log connection attempt
    this.auditlogService.logInfo(
      'WebSocket',
      `Connection attempt from IP: ${ip}`,
    );

    // Validate credentials
    const isValid = await this.validateCredentials(token, uuid);

    if (!isValid) {
      this.auditlogService.logError('WebSocket authentication failed', 'Auth', {
        ip,
        token: token?.substring(0, 10) + '...',
      });
      throw new WsException('Unauthorized');
    }

    // Log successful connection
    this.auditlogService.logInfo(
      'WebSocket',
      `Authenticated connection from IP: ${ip}`,
    );
    return true;
  }

  async validateMessageCredentials(
    token: string,
    uuid: string,
  ): Promise<boolean> {
    if (!token || !uuid || !this.connectData) {
      return false;
    }

    return token === this.connectData.token && uuid === this.connectData.uuid;
  }

  private async validateCredentials(
    token: string,
    uuid: string,
  ): Promise<boolean> {
    // For connection-level auth, use the same validation as message auth
    return this.validateMessageCredentials(token, uuid);
  }
}
