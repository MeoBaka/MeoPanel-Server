import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { AuditlogExceptionFilter } from './auditlog/auditlog.exception-filter';
import { AuditlogService } from './auditlog/auditlog.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new WsAdapter(app));

  // Apply global exception filter
  app.useGlobalFilters(app.get(AuditlogExceptionFilter));

  const port = process.env.HWSPORT || 3000;
  await app.listen(port);

  // Log server startup with port
  app
    .get(AuditlogService)
    .logServerStartup(Number(port));
}
bootstrap();
