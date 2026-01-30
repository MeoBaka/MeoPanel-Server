"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const platform_ws_1 = require("@nestjs/platform-ws");
const auditlog_exception_filter_1 = require("./auditlog/auditlog.exception-filter");
const auditlog_service_1 = require("./auditlog/auditlog.service");
const fs = __importStar(require("fs"));
const ssl_util_1 = require("./utils/ssl.util");
async function bootstrap() {
    const sslEnabled = process.env.SSL_ENABLED === 'true';
    const port = process.env.HWSPORT || 3000;
    const host = process.env.HWSHOST || '0.0.0.0';
    const certPath = process.env.SSL_CERT_PATH || './certs/cert.pem';
    const keyPath = process.env.SSL_KEY_PATH || './certs/key.pem';
    let httpsOptions = undefined;
    if (sslEnabled) {
        const sslConfig = await (0, ssl_util_1.ensureSSLCertificate)(certPath, keyPath);
        httpsOptions = {
            key: fs.readFileSync(sslConfig.keyPath),
            cert: fs.readFileSync(sslConfig.certPath),
        };
        common_1.Logger.log(`🔒 SSL enabled - Server will use HTTPS and WSS`);
        common_1.Logger.log(`📜 Certificate: ${sslConfig.certPath}`);
        common_1.Logger.log(`🔑 Private Key: ${sslConfig.keyPath}`);
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, httpsOptions ? { httpsOptions } : undefined);
    app.useWebSocketAdapter(new platform_ws_1.WsAdapter(app));
    app.useGlobalFilters(app.get(auditlog_exception_filter_1.AuditlogExceptionFilter));
    await app.listen(port, host);
    app
        .get(auditlog_service_1.AuditlogService)
        .logServerStartup(Number(port));
}
bootstrap();
//# sourceMappingURL=main.js.map