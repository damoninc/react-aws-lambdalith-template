import type { HealthResponse, HelloResponse } from '@starter/shared';
import { Controller, Get } from '@nestjs/common';

@Controller('api')
export class AppController {
  @Get('health')
  health(): HealthResponse {
    return {
      status: 'ok',
      service: 'lambdalith-api',
    };
  }

  @Get('hello')
  hello(): HelloResponse {
    return {
      message: 'Hello from the lambdalith!',
    };
  }
}
