import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // ── CORS ──────────────────────────────────────────────────────────────────
  // Allow the Vite dev server (5173) and any production origin to reach the API.
  // In production, restrict 'origin' to your actual domain.
  app.enableCors({
    origin: true, // Allow all origins for local network mobile testing
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`[EBOS Backend] Listening on 0.0.0.0:${port} (Accessible via WiFi)`);
}
bootstrap();
