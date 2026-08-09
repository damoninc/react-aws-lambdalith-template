import awsLambdaFastify from '@fastify/aws-lambda';
import { createApp } from './app';

const app = createApp();

export const handler = awsLambdaFastify(app);
