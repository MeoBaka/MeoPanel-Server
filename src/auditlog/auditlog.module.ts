import { Module } from '@nestjs/common';
import { AuditlogService } from './auditlog.service';
import { AuditlogExceptionFilter } from './auditlog.exception-filter';

@Module({
  providers: [AuditlogService, AuditlogExceptionFilter],
  exports: [AuditlogService, AuditlogExceptionFilter],
})
export class AuditlogModule {}
