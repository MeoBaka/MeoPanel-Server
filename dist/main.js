"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const platform_ws_1 = require("@nestjs/platform-ws");
const auditlog_exception_filter_1 = require("./auditlog/auditlog.exception-filter");
const auditlog_service_1 = require("./auditlog/auditlog.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    app.useGlobalFilters(app.get(auditlog_exception_filter_1.AuditlogExceptionFilter));
    const port = process.env.HWSPORT || 3000;
    await app.listen(port);
    app
        .get(auditlog_service_1.AuditlogService)
        .logInfo('Startup', `Application is running on: http://localhost:${port}`);
}
bootstrap();
//# sourceMappingURL=main.js.map