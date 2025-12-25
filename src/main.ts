import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WebSocket } from 'ws';
import { PingService } from './ping/ping.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const pingService = app.get(PingService);

  const server = app.getHttpServer();
  const wss = new WebSocket.Server({ server });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      const msg = message.toString();
      if (msg === 'ping') {
        ws.send(JSON.stringify(pingService.ping()));
      }
    });
  });

  await app.listen(3000);
}
bootstrap();
