import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    const timestamp = new Date().toISOString();

    if (exception instanceof QueryFailedError) {
      // Handle database constraint violations
      this.logger.debug(`Database error: ${exception.message}`);

      // Check for unique constraint violation
      if ((exception as any).code === '23505') {
        status = HttpStatus.CONFLICT;
        message = 'A resource with this identifier already exists';
      }
      // Check constraint violation
      else if ((exception as any).code === '23514') {
        status = HttpStatus.BAD_REQUEST;
        message =
          'The data violates business rules. Ensure end time is after start time.';
      }
      // Foreign key violation
      else if ((exception as any).code === '23503') {
        status = HttpStatus.BAD_REQUEST;
        message = 'Referenced resource does not exist';
      }
    } else if (exception instanceof Error) {
      // For NestJS exceptions (ConflictException, BadRequestException, etc.)
      const httpException = exception as any;

      if (httpException.getStatus) {
        status = httpException.getStatus();
        const response = httpException.getResponse();

        if (typeof response === 'object') {
          message = (response as any).message || exception.message;
        } else {
          message = exception.message;
        }
      } else {
        message = exception.message || 'An unexpected error occurred';
      }
    }

    this.logger.error(
      `Error: ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    response.status(status).json({
      statusCode: status,
      message,
      timestamp,
    });
  }
}
