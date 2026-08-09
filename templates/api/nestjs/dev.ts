import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

const port = 3001;
const app = await NestFactory.create(AppModule);

await app.listen(port);
console.log(`Local NestJS API: http://localhost:${port}`);
