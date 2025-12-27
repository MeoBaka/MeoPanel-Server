"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditlogModule = void 0;
const common_1 = require("@nestjs/common");
const auditlog_service_1 = require("./auditlog.service");
const auditlog_exception_filter_1 = require("./auditlog.exception-filter");
let AuditlogModule = class AuditlogModule {
};
exports.AuditlogModule = AuditlogModule;
exports.AuditlogModule = AuditlogModule = __decorate([
    (0, common_1.Module)({
        providers: [auditlog_service_1.AuditlogService, auditlog_exception_filter_1.AuditlogExceptionFilter],
        exports: [auditlog_service_1.AuditlogService, auditlog_exception_filter_1.AuditlogExceptionFilter],
    })
], AuditlogModule);
//# sourceMappingURL=auditlog.module.js.map