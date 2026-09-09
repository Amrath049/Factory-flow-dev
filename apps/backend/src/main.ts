import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { Express, Request, Response } from 'express';

const server: Express = express();
let isInitialized = false;

async function bootstrapServer(): Promise<Express> {
  if (!isInitialized) {
    const app = await NestFactory.create(AppModule, new ExpressAdapter(server));
    app.setGlobalPrefix('api', { exclude: ['/'] });

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

    await app.init();
    isInitialized = true;
  }
  return server;
}

// Global bootstrap for local non-serverless development
if (!process.env.VERCEL) {
  bootstrapServer().then((appInstance) => {
    const port = process.env.PORT ?? 3000;
    appInstance.listen(port, () => {
      console.log(`FactoryFlow API running on port ${port}`);
    });
  });
}

// Export default handler for Vercel Serverless Function
export default async function handler(req: Request, res: Response) {
  try {
    const appInstance = await bootstrapServer();
    appInstance(req, res);
  } catch (err: any) {
    console.error('Vercel Serverless Function error:', err);
    res.status(500).json({
      statusCode: 500,
      message: 'Internal server error in serverless handler',
      error: err?.message || String(err),
    });
  }
}

