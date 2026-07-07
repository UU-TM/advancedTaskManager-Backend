import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Advanced Task Manager API')
    .setDescription(
      'REST API for the Advanced Task Manager application. Successful responses are wrapped as `{ message, status, data }`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token',
      },
      'access-token',
    )
    .addTag('Auth', 'Authentication and session management')
    .addTag('Workspaces', 'Workspace and membership management')
    .addTag('Boards', 'Board, column, and membership management')
    .addTag('Cards', 'Card management, ordering, and assignments')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, cleanupOpenApiDoc(document), {
    swaggerOptions: { persistAuthorization: true },
  });
}
