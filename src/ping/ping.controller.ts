import { Controller, Get } from '@nestjs/common';

@Controller()
export class PingController {
  @Get()
  getStatus(): { message: string } {
    return { message: '[MeoPanel Server] Status: OK | reference: null' };
  }
}
