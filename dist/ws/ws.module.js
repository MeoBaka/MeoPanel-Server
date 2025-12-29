"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WsModule = void 0;
const common_1 = require("@nestjs/common");
const ws_gateway_1 = require("./ws.gateway");
const ping_module_1 = require("../ping/ping.module");
const connect_module_1 = require("../connect/connect.module");
const pm2_module_1 = require("../pm2/pm2.module");
const meoguard_module_1 = require("../meoguard/meoguard.module");
let WsModule = class WsModule {
};
exports.WsModule = WsModule;
exports.WsModule = WsModule = __decorate([
    (0, common_1.Module)({
        imports: [ping_module_1.PingModule, connect_module_1.ConnectModule, pm2_module_1.Pm2Module, meoguard_module_1.MeoguardModule],
        providers: [ws_gateway_1.WsGateway],
    })
], WsModule);
//# sourceMappingURL=ws.module.js.map