import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { PingModule } from '../ping/ping.module';
import { ConnectModule } from '../connect/connect.module';
import { Pm2Module } from '../pm2/pm2.module';
import { MeoguardModule } from '../meoguard/meoguard.module';
import { AuditlogModule } from '../auditlog/auditlog.module';

@Module({
  imports: [PingModule, ConnectModule, Pm2Module, MeoguardModule, AuditlogModule],
  providers: [WsGateway],
})
export class WsModule {}
