import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Allow the Vite dev server (5173) and any production origin to reach the API.
  // In production, restrict 'origin' to your actual domain.
  app.enableCors({
    origin: [
      'http://localhost:5173',
      'http://localhost:4173', // vite preview
      'http://127.0.0.1:5173',
    ],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[EBOS Backend] Listening on http://localhost:${port}`);
}
bootstrap();
