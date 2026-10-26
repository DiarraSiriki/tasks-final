import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { envSchema } from './config/env.schema.js';
import { ExampleModule } from './modules/example/example.module.js';
import { TasksModule } from './modules/tasks/tasks.module.js';
import { UsersModule } from './modules/users/users.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			validate: (config) => envSchema.parse(config),
		}),
		LoggerModule.forRoot({
			pinoHttp: {
				transport: process.env.NODE_ENV !== 'production' ? { target: 'pino-pretty' } : undefined,
			},
		}),
		ThrottlerModule.forRoot([{ ttl: 60000, limit: 20 }]),
		TerminusModule,
		PrismaModule,
		AuthModule,
		ExampleModule,
		TasksModule,
		UsersModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{ provide: APP_FILTER, useClass: HttpExceptionFilter },
		{ provide: APP_GUARD, useClass: ThrottlerGuard },
	],
})
export class AppModule {}
