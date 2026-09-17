import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app/app.module';

export const PORT = Number(process.env.PORT ?? 4711);

/** The UI dev server and the built UI. Nothing else may talk to this API. */
const ALLOWED_ORIGINS = [
  `http://localhost:${process.env.UI_PORT ?? 4200}`,
  `http://127.0.0.1:${process.env.UI_PORT ?? 4200}`,
];

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  // This API runs shell scripts and starts agents. A reflecting CORS policy
  // would let any page the developer happens to visit drive the factory.
  app.enableCors({ origin: ALLOWED_ORIGINS });
  // loopback only, never the LAN
  await app.listen(PORT, '127.0.0.1');
  Logger.log(`Factory API on http://127.0.0.1:${PORT}/api`);
}

bootstrap();
