import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app/app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });

  app.setGlobalPrefix('api');

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  app.enableCors({
    origin: /^https?:\/\/(localhost(:\d+)?|(.+\.)?robosgig\.com)$/,
    credentials: true,
  });

  // Swagger docs at /api/docs
  const config = new DocumentBuilder()
    .setTitle('Taskflow API')
    .setDescription('AI-powered local task marketplace')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  Logger.log(`Application running on: http://localhost:${port}/api`);
  Logger.log(`Swagger docs at:        http://localhost:${port}/api/docs`);
}

bootstrap();
