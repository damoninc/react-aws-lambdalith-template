import type { APIGatewayProxyHandlerV2 } from 'aws-lambda';
import { route } from './router';

export const handler: APIGatewayProxyHandlerV2 = async (event) => {
  const response = await route({
    method: event.requestContext.http.method,
    path: event.rawPath,
    body: event.body,
  });

  return {
    statusCode: response.statusCode,
    headers: {
      'content-type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(response.body),
  };
};
