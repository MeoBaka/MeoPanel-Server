import { Module } from '@nestjs/common';
import { WsGateway } from './ws.gateway';
import { PingModule } from '../ping/ping.module';
import { ConnectModule } from '../connect/connect.module';

@Module({
  imports: [PingModule, ConnectModule],
  providers: [WsGateway],
})
export class WsModule {}
