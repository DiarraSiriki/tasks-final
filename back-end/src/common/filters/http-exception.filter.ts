import {
	type ArgumentsHost,
	Catch,
	type ExceptionFilter,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

type HttpExceptionBody = {
	message?: string | string[];
	error?: string;
};

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
	private readonly logger = new Logger(HttpExceptionFilter.name);

	catch(exception: unknown, host: ArgumentsHost) {
		const ctx = host.switchToHttp();
		const response = ctx.getResponse<Response>();
		const request = ctx.getRequest<Request>();

		const status =
			exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;

		let message: string | string[] = 'Internal server error';
		let error: string | undefined;

		if (exception instanceof HttpException) {
			const body = exception.getResponse();
			if (typeof body === 'string') {
				message = body;
			} else {
				const parsed = body as HttpExceptionBody;
				message = parsed.message ?? exception.message;
				error = parsed.error;
			}
		} else {
			this.logger.error(
				`Unhandled exception on ${request.method} ${request.originalUrl}`,
				exception instanceof Error ? exception.stack : String(exception),
			);
		}

		response.status(status).json({
			statusCode: status,
			timestamp: new Date().toISOString(),
			path: request.originalUrl,
			message,
			error,
		});
	}
}
