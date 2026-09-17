import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

export const PORT = Number(process.env.PORT ?? 4711);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: true });
  await app.listen(PORT);
  Logger.log(`Factory API on http://localhost:${PORT}/api`);
}

bootstrap();
