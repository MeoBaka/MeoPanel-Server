import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PingModule } from './ping/ping.module';
import { WsModule } from './ws/ws.module';
import { ConnectModule } from './connect/connect.module';
import { AuditlogModule } from './auditlog/auditlog.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PingModule,
    WsModule,
    ConnectModule,
    AuditlogModule,
  ],
})
export class AppModule {}
