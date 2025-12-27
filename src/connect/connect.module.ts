import { Module } from '@nestjs/common';
import { ConnectService } from './connect.service';

@Module({
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}