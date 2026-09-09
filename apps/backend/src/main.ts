// import 'reflect-metadata';
// import { NestFactory } from '@nestjs/core';
// import { AppModule } from './app.module';
// import { ValidationPipe, INestApplication } from '@nestjs/common';
// import { NestExpressApplication } from '@nestjs/platform-express';

// let cachedApp: NestExpressApplication;

// async function bootstrap(): Promise<NestExpressApplication> {
//   if (cachedApp) return cachedApp;

//   const app = await NestFactory.create<NestExpressApplication>(AppModule);
//   app.setGlobalPrefix('api', { exclude: ['/'] });

//   const allowedOrigin = process.env.CORS_ORIGIN ?? '*';
//   app.enableCors({
//     origin: allowedOrigin,
//     methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
//     allowedHeaders: 'Content-Type, Authorization',
//     credentials: true,
//   });

//   app.useGlobalPipes(
//     new ValidationPipe({
//       whitelist: true,
//       forbidNonWhitelisted: true,
//       transform: true,
//     }),
//   );

//   await app.init();
//   cachedApp = app;
//   return app;
// }

// // Global bootstrap for non-serverless (local development)
// if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
//   bootstrap().then(async (app) => {
//     const port = process.env.PORT ?? 3000;
//     await app.listen(port);
//     console.log(`FactoryFlow API running on port ${port}`);
//   });
// }

// // Export for Vercel
// export default async (req: any, res: any) => {
//   const app = await bootstrap();
//   const instance = app.getHttpAdapter().getInstance();
//   instance(req, res);
// };

import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.setGlobalPrefix('api', {
    exclude: ['/'],
  });

  const allowedOrigin = process.env.CORS_ORIGIN ?? '*';

  app.enableCors({
    origin: allowedOrigin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap();
