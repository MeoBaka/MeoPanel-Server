import { Injectable } from '@nestjs/common';

@Injectable()
export class PingService {
  ping(): { pong: number; status: string } {
    return { pong: Date.now(), status: 'ok' };
  }
}