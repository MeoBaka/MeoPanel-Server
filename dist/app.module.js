"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ping_module_1 = require("./ping/ping.module");
const ws_module_1 = require("./ws/ws.module");
const connect_module_1 = require("./connect/connect.module");
const auditlog_module_1 = require("./auditlog/auditlog.module");
const pm2_module_1 = require("./pm2/pm2.module");
const meoguard_module_1 = require("./meoguard/meoguard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            auditlog_module_1.AuditlogModule,
            pm2_module_1.Pm2Module,
            meoguard_module_1.MeoguardModule,
            ping_module_1.PingModule,
            ws_module_1.WsModule,
            connect_module_1.ConnectModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map