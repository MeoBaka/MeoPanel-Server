import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PingModule } from './ping/ping.module';
import { WsModule } from './ws/ws.module';
import { ConnectModule } from './connect/connect.module';

@Module({
  imports: [ConfigModule.forRoot({
    isGlobal: true,
  }), PingModule, WsModule, ConnectModule],
})
export class AppModule {}
