import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { AuditlogService } from './auditlog.service';

@Catch()
@Injectable()
export class AuditlogExceptionFilter implements ExceptionFilter {
  constructor(private readonly auditlogService: AuditlogService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status =
      exception instanceof HttpException ? exception.getStatus() : 500;
    const message = exception.message || 'Internal server error';

    // Log the error
    this.auditlogService.logError(`HTTP ${status} Error: ${message}`, 'HTTP');

    // Continue with default behavior or customize response
    if (host.getType() === 'http') {
      response.status(status).json({
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        message,
      });
    } else {
      // For other types, just log
    }
  }
}
