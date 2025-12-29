"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditlogExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const auditlog_service_1 = require("./auditlog.service");
let AuditlogExceptionFilter = class AuditlogExceptionFilter {
    auditlogService;
    constructor(auditlogService) {
        this.auditlogService = auditlogService;
    }
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception instanceof common_1.HttpException ? exception.getStatus() : 500;
        const message = exception.message || 'Internal server error';
        this.auditlogService.logError(`HTTP ${status} Error: ${message}`, 'HTTP');
        if (host.getType() === 'http') {
            response.status(status).json({
                statusCode: status,
                timestamp: new Date().toISOString(),
                path: request.url,
                message,
            });
        }
        else {
        }
    }
};
exports.AuditlogExceptionFilter = AuditlogExceptionFilter;
exports.AuditlogExceptionFilter = AuditlogExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auditlog_service_1.AuditlogService])
], AuditlogExceptionFilter);
//# sourceMappingURL=auditlog.exception-filter.js.map