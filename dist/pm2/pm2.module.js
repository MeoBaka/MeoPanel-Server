"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Pm2Module = void 0;
const common_1 = require("@nestjs/common");
const pm2_service_1 = require("./pm2.service");
const auditlog_module_1 = require("../auditlog/auditlog.module");
let Pm2Module = class Pm2Module {
};
exports.Pm2Module = Pm2Module;
exports.Pm2Module = Pm2Module = __decorate([
    (0, common_1.Module)({
        imports: [auditlog_module_1.AuditlogModule],
        providers: [pm2_service_1.Pm2Service],
        exports: [pm2_service_1.Pm2Service],
    })
], Pm2Module);
//# sourceMappingURL=pm2.module.js.map