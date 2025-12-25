"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const ws_1 = require("ws");
const ping_service_1 = require("./ping/ping.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const pingService = app.get(ping_service_1.PingService);
    const server = app.getHttpServer();
    const wss = new ws_1.WebSocket.Server({ server });
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
//# sourceMappingURL=main.js.map