import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PingModule } from './ping/ping.module';
import { WsModule } from './ws/ws.module';
import { ConnectModule } from './connect/connect.module';
import { AuditlogModule } from './auditlog/auditlog.module';
import { Pm2Module } from './pm2/pm2.module';
import { MeoguardModule } from './meoguard/meoguard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    AuditlogModule,
    Pm2Module,
    MeoguardModule,
    PingModule,
    WsModule,
    ConnectModule,
  ],
})
export class AppModule {}
