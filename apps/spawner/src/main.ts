import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';

function assertRequiredEnv() {
  const required = ['SERVER_SECRET_KEY', 'REDIS_URL', 'DB_HOST', 'DB_USER', 'DB_NAME'];
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`Missing required spawner env vars: ${missing.join(', ')}`);
  }
}

async function bootstrap() {
  assertRequiredEnv();
  const { AppModule } = await import('./app.module');
  const app = await NestFactory.create(AppModule);
  const port = Number(process.env.SPAWNER_PORT || process.env.PORT || 3002);
  await app.listen(port, '0.0.0.0');
}

void bootstrap();
