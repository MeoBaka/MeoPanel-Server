import { Module } from '@nestjs/common';
import { Pm2Service } from './pm2.service';
import { AuditlogModule } from '../auditlog/auditlog.module';

@Module({
  imports: [AuditlogModule],
  providers: [Pm2Service],
  exports: [Pm2Service],
})
export class Pm2Module {}
