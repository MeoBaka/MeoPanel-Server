import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server } from 'ws';
import { PingService } from '../ping/ping.service';
import { ConnectService } from '../connect/connect.service';
import { Pm2Service } from '../pm2/pm2.service';
import { MeoGuard } from '../meoguard/meoguard.guard';
export declare class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly pingService;
    private readonly connectService;
    private readonly pm2Service;
    private readonly meoGuard;
    server: Server;
    private logWatchers;
    constructor(pingService: PingService, connectService: ConnectService, pm2Service: Pm2Service, meoGuard: MeoGuard);
    handleConnection(client: any): void;
    handleDisconnect(client: any): void;
}
