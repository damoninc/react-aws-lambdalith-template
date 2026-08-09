import type { HealthResponse, HelloResponse } from '@starter/shared';

export interface RequestContext {
  method: string;
  path: string;
  body?: string;
}

export interface RouteResponse {
  statusCode: number;
  body: unknown;
}

export async function route(request: RequestContext): Promise<RouteResponse> {
  if (request.method === 'GET' && request.path === '/api/health') {
    const body: HealthResponse = {
      status: 'ok',
      service: 'lambdalith-api',
    };

    return { statusCode: 200, body };
  }

  if (request.method === 'GET' && request.path === '/api/hello') {
    const body: HelloResponse = {
      message: 'Hello from the lambdalith!',
    };

    return { statusCode: 200, body };
  }

  return {
    statusCode: 404,
    body: { message: `No route for ${request.method} ${request.path}` },
  };
}
