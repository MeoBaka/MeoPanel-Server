import { Module } from '@nestjs/common';
import { ConnectService } from './connect.service';
import { Pm2Module } from '../pm2/pm2.module';

@Module({
  imports: [Pm2Module],
  providers: [ConnectService],
  exports: [ConnectService],
})
export class ConnectModule {}
