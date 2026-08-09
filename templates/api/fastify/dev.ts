import { createApp } from './app';

const port = 3001;
const app = createApp();

await app.listen({
  port,
  host: '0.0.0.0',
});

console.log(`Local Fastify API: http://localhost:${port}`);
