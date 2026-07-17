import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { bodyParser: true });

  app.use(helmet());
  app.use(cookieParser()); // reads the httpOnly refresh cookie

  // CORS is now an explicit allow-list. `origin: '*'` + `credentials: true`
  // is not even a legal combination in the browser spec.
  const origins = (process.env.FRONTEND_URL ?? 'http://localhost:3001')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: origins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // strip unknown properties (e.g. a spoofed `userId`/`role`)
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.useGlobalFilters(new AllExceptionsFilter());
  app.enableShutdownHooks();

  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('SmartRoadmap API')
      .setDescription('AI learning paths & talent matching')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, config));
    logger.log('Swagger docs available at /docs');
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`API listening on :${port} | CORS: ${origins.join(', ')}`);
}

bootstrap();

