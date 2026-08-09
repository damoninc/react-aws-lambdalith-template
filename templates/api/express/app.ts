import type { HealthResponse, HelloResponse } from '@starter/shared';
import express from 'express';

export const app = express();

app.use(express.json());

app.get('/api/health', (_req, res) => {
  const body: HealthResponse = {
    status: 'ok',
    service: 'lambdalith-api',
  };

  res.json(body);
});

app.get('/api/hello', (_req, res) => {
  const body: HelloResponse = {
    message: 'Hello from the lambdalith!',
  };

  res.json(body);
});
