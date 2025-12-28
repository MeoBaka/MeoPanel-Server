import { Module } from '@nestjs/common';
import { MeoGuard } from './meoguard.guard';
import { AuditlogModule } from '../auditlog/auditlog.module';

@Module({
  imports: [AuditlogModule],
  providers: [MeoGuard],
  exports: [MeoGuard],
})
export class MeoguardModule {}
