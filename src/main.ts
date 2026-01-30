import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { AuditlogExceptionFilter } from './auditlog/auditlog.exception-filter';
import { AuditlogService } from './auditlog/auditlog.service';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as https from 'https';
import { ensureSSLCertificate } from './utils/ssl.util';

async function bootstrap() {
  const sslEnabled = process.env.SSL_ENABLED === 'true';
  const port = process.env.HWSPORT || 3000;
  const host = process.env.HWSHOST || '0.0.0.0';
  const certPath = process.env.SSL_CERT_PATH || './certs/cert.pem';
  const keyPath = process.env.SSL_KEY_PATH || './certs/key.pem';

  let httpsOptions: { key: Buffer; cert: Buffer } | undefined = undefined;
  
  if (sslEnabled) {
    // Tự động tạo certificate nếu chưa tồn tại
    const sslConfig = await ensureSSLCertificate(certPath, keyPath);
    
    // Đọc certificate và key
    httpsOptions = {
      key: fs.readFileSync(sslConfig.keyPath),
      cert: fs.readFileSync(sslConfig.certPath),
    };
    
    Logger.log(`🔒 SSL enabled - Server will use HTTPS and WSS`);
    Logger.log(`📜 Certificate: ${sslConfig.certPath}`);
    Logger.log(`🔑 Private Key: ${sslConfig.keyPath}`);
  }

  // Tạo app sau khi SSL đã được tạo thành công
  const app = await NestFactory.create(AppModule, httpsOptions ? { httpsOptions } : undefined);

  app.useWebSocketAdapter(new WsAdapter(app));

  // Apply global exception filter
  app.useGlobalFilters(app.get(AuditlogExceptionFilter));

  await app.listen(port, host);

  // Log server startup with port
  app
    .get(AuditlogService)
    .logServerStartup(Number(port));
}
bootstrap();
