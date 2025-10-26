// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // Obtener ConfigService
  const configService = app.get(ConfigService);
  const port = process.env.PORT || 3000;
  const apiPrefix = configService.get<string>('apiPrefix') || 'api/v1';

  // Configurar prefijo global de API
  app.setGlobalPrefix(apiPrefix);

  // Habilitar CORS
  app.enableCors({
    origin: true, // En producción, especificar dominios permitidos
    credentials: true,
  });

  // Configurar validación global de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades no definidas en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Rappi Clone API')
    .setDescription('API para plataforma multi-negocios de delivery')
    .setVersion('1.0')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('users', 'Gestión de usuarios')
    .addTag('businesses', 'Gestión de negocios')
    .addTag('categories', 'Gestión de categorías')
    .addTag('products', 'Gestión de productos')
    .addTag('ingredients', 'Gestión de ingredientes')
    .addTag('promotions', 'Gestión de promociones')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingresa tu token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  await app.listen(port);
  
  console.log(`
    🚀 Aplicación corriendo en: http://localhost:${port}/${apiPrefix}
    📚 Documentación Swagger: http://localhost:${port}/api/docs
    🌍 Ambiente: ${configService.get<string>('nodeEnv')}
  `);
}

bootstrap();