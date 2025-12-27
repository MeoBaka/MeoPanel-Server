import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { OnModuleInit } from '@nestjs/common';
import { Server } from 'ws';
import { PingService } from '../ping/ping.service';
import { ConnectService } from '../connect/connect.service';
export declare class WsGateway implements OnGatewayConnection, OnGatewayDisconnect, OnModuleInit {
    private readonly pingService;
    private readonly connectService;
    server: Server;
    private connectData;
    constructor(pingService: PingService, connectService: ConnectService);
    onModuleInit(): void;
    private generateConnectData;
    handleConnection(client: any): void;
    handleDisconnect(client: any): void;
}
