# MeoPanel Server

A NestJS-based server application for MeoPanel, providing REST API endpoints, WebSocket support for real-time communication, PM2 process management, audit logging, and authentication guards.

## Description

MeoPanel Server is built with [NestJS](https://nestjs.com/), a progressive Node.js framework for building efficient and scalable server-side applications. It provides comprehensive server management capabilities including health monitoring, real-time WebSocket communication, PM2 process control, audit logging, and secure authentication mechanisms.

## Features

- **REST API**: Health check and system status endpoints
- **WebSocket Support**: Real-time communication with ping/pong, connection authentication, and PM2 process listing
- **PM2 Integration**: Process management and monitoring capabilities
- **Audit Logging**: Comprehensive logging system for tracking system activities
- **Authentication Guards**: Custom guards for securing endpoints and WebSocket connections
- **Environment Configuration**: Configurable settings via `.env` file
- **TypeScript**: Fully typed codebase for better development experience

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd MeoPanel-Server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create environment file:
   ```bash
   cp .env.example .env
   ```

4. Configure your environment variables in `.env`:
   ```
   HWSPORT=3000
   ```

5. Configure `connect.json` for WebSocket authentication:
   ```json
   {
     "uuid": "your-uuid",
     "token": "your-token"
   }
   ```

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

- `HWSPORT`: The port number on which the server will listen (default: 3000)

Additionally, a `connect.json` file is required for WebSocket authentication. This file should contain the UUID and token for connecting to the server.

## Running the Application

### Development Mode
```bash
npm run start:dev
```

### Production Mode
```bash
npm run start:prod
```

### Build
```bash
npm run build
```

## API Endpoints

### GET /
Returns the server status.

**Response:**
```json
{
  "message": "[MeoPanel Server] Status: OK | reference: null"
}
```

## WebSocket

The server supports WebSocket connections for real-time communication with multiple command types.

### Connection
Connect to `ws://localhost:{HWSPORT}`

### Ping
Send a message with content `"ping"` to receive a pong response.

**Request:**
```
ping
```

**Response:**
```json
{
  "pong": 1640995200000,
  "status": "ok"
}
```

### Connect (Legacy)
Get system information using UUID and token from `connect.json`. Note: This is the legacy method. Use the 'status' command instead.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token"
}
```

**Response:**
```json
{
  "connection_address": "ws://localhost:3000",
  "memory": {
    "total": 17179869184,
    "used": 8589934592,
    "free": 8589934592
  },
  "cpu": 8,
  "disk_space": {
    "used": 0,
    "max": 107374182400,
    "allow": 107374182400
  },
  "total_instances": 0,
  "running_instances": 0,
  "stopped_instances": 0,
  "platform": "windows",
  "version": {
    "node": "v20.19.5",
    "server": "1.0.0"
  }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token"
}
```

### PM2 List
Retrieve the list of PM2 managed processes. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-list"
}
```

**Response:**
```json
{
  "type": "pm2-list",
  "data": [
    {
      "pid": 1234,
      "name": "app",
      "status": "online"
    }
  ]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### Status
Get system information using UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "status"
}
```

**Response:**
```json
{
  "connection_address": "ws://localhost:3000",
  "memory": {
    "total": 17179869184,
    "used": 8589934592,
    "free": 8589934592
  },
  "cpu": 8,
  "disk_space": {
    "used": 0,
    "max": 107374182400,
    "allow": 107374182400
  },
  "total_instances": 0,
  "running_instances": 0,
  "stopped_instances": 0,
  "platform": "windows",
  "version": {
    "node": "v20.19.5",
    "server": "1.0.0"
  }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for status command"
}
```

### PM2 Start
Start a new PM2 process. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-start",
  "script": "path/to/script.js",
  "name": "process-name"
}
```

**Response:**
```json
{
  "type": "pm2-start",
  "data": { ... }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Stop
Stop a PM2 process. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-stop",
  "id": 123
}
```

**Response:**
```json
{
  "type": "pm2-stop",
  "data": { ... }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Restart
Restart a PM2 process. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-restart",
  "id": 123
}
```

**Response:**
```json
{
  "type": "pm2-restart",
  "data": { ... }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Delete
Delete a PM2 process. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-delete",
  "id": 123
}
```

**Response:**
```json
{
  "type": "pm2-delete",
  "data": { ... }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Multi-Start
Start multiple PM2 processes. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-multi-start",
  "processes": [
    {
      "script": "path/to/script1.js",
      "name": "process1"
    },
    {
      "script": "path/to/script2.js",
      "name": "process2"
    }
  ]
}
```

**Response:**
```json
{
  "type": "pm2-multi-start",
  "data": [ ... ]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Multi-Stop
Stop multiple PM2 processes. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-multi-stop",
  "ids": [1, 2]
}
```

**Response:**
```json
{
  "type": "pm2-multi-stop",
  "data": [ ... ]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Multi-Restart
Restart multiple PM2 processes. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-multi-restart",
  "ids": [1, 2]
}
```

**Response:**
```json
{
  "type": "pm2-multi-restart",
  "data": [ ... ]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Multi-Delete
Delete multiple PM2 processes. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-multi-delete",
  "ids": [1, 2]
}
```

**Response:**
```json
{
  "type": "pm2-multi-delete",
  "data": [ ... ]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Resurrect
Resurrect PM2 processes from the saved dump. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-resurrect"
}
```

**Response:**
```json
{
  "type": "pm2-resurrect",
  "data": {}
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Save
Save the current PM2 process list to a dump file. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-save"
}
```

**Response:**
```json
{
  "type": "pm2-save",
  "data": {}
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Logs
Get the last 200 lines of logs for a PM2 process. Requires authentication with UUID and token from `connect.json`.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-logs",
  "id": 123,
  "lines": 200
}
```

**Response:**
```json
{
  "type": "pm2-logs",
  "data": ["log line 1", "log line 2", ...]
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

### PM2 Send
Send data to a PM2 process. This allows sending messages or commands to running Node.js processes that listen for messages. Requires authentication with UUID and token from `connect.json`. The process must be started in fork mode and have a `process.on('message')` handler.

**Request:**
```json
{
  "uuid": "your-uuid",
  "token": "your-token",
  "command": "pm2-send",
  "id": 123,
  "data": "message or command to send"
}
```

**Response:**
```json
{
  "type": "pm2-send",
  "data": { ... }
}
```

**Error Response (Unauthorized):**
```json
{
  "type": "error",
  "message": "Unauthorized: Invalid UUID or token for PM2 command"
}
```

**Note:** This is used by the MeoPanel client to send data to processes. For example, sending "5+5" to a Node.js process that evaluates expressions. The process must be a Node.js application running in fork mode with message handling.

## Project Structure

```
src/
├── app.module.ts              # Main application module
├── main.ts                    # Application entry point
├── auditlog/
│   ├── auditlog.exception-filter.ts # Exception filter for audit logging
│   ├── auditlog.module.ts     # Audit logging module
│   └── auditlog.service.ts    # Audit logging service
├── connect/
│   ├── connect.module.ts      # Connection module
│   └── connect.service.ts     # Connection service
├── meoguard/
│   ├── meoguard.guard.ts      # Custom authentication guard
│   └── meoguard.module.ts     # Guard module
├── ping/
│   ├── ping.controller.ts     # REST API controller
│   ├── ping.module.ts         # Ping module
│   └── ping.service.ts        # Ping service logic
├── pm2/
│   ├── pm2.module.ts          # PM2 management module
│   └── pm2.service.ts         # PM2 service for process management
└── ws/
    ├── ws.gateway.ts          # WebSocket gateway
    └── ws.module.ts           # WebSocket module
```

## Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in watch mode
- `npm run start:debug` - Start in debug mode
- `npm run start:prod` - Start the production build
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Technologies Used

- [NestJS](https://nestjs.com/) - Node.js framework
- [TypeScript](https://www.typescriptlang.org/) - Programming language
- [WebSocket](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API) - Real-time communication
- [PM2](https://pm2.keymetrics.io/) - Process manager for Node.js applications
- [Winston](https://github.com/winstonjs/winston) - Logging library
- [RxJS](https://rxjs.dev/) - Reactive programming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license.
