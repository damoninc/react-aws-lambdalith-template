import type { HealthResponse, HelloResponse } from '@starter/shared';
import Fastify from 'fastify';

export function createApp() {
  const app = Fastify();

  app.get('/api/health', async () => {
    const body: HealthResponse = {
      status: 'ok',
      service: 'lambdalith-api',
    };

    return body;
  });

  app.get('/api/hello', async () => {
    const body: HelloResponse = {
      message: 'Hello from the lambdalith!',
    };

    return body;
  });

  return app;
}
