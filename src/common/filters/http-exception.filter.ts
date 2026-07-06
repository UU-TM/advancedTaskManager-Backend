import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorEnvelope {
  message: string;
  status: number;
  data: null;
}

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception.getStatus();

    const body: ErrorEnvelope = {
      message: this.resolveMessage(exception),
      status,
      data: null,
    };

    response.status(status).json(body);
  }

  private resolveMessage(exception: HttpException): string {
    const res = exception.getResponse();

    if (typeof res === 'string') {
      return res;
    }

    const message = (res as { message?: string | string[] }).message;

    if (Array.isArray(message)) {
      return message.join(', ');
    }

    return message ?? exception.message;
  }
}
