import { Module } from '@nestjs/common';
import { Pm2Service } from './pm2.service';
import { AuditlogModule } from '../auditlog/auditlog.module';
import { ConsoleModule } from '../console/console.module';

@Module({
  imports: [AuditlogModule, ConsoleModule],
  providers: [Pm2Service],
  exports: [Pm2Service],
})
export class Pm2Module {}
