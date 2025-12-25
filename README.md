# MeoPanel Server

A NestJS-based server application for MeoPanel, providing REST API endpoints and WebSocket support for real-time communication.

## Description

MeoPanel Server is built with [NestJS](https://nestjs.com/), a progressive Node.js framework for building efficient and scalable server-side applications. It includes basic health check endpoints and WebSocket functionality for ping/pong operations.

## Features

- **REST API**: Health check endpoint to verify server status
- **WebSocket Support**: Real-time ping/pong communication using WebSocket
- **Environment Configuration**: Configurable port via `.env` file
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

## Configuration

The application uses environment variables for configuration. Create a `.env` file in the root directory with the following variables:

- `HWSPORT`: The port number on which the server will listen (default: 3000)

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

The server supports WebSocket connections for real-time communication.

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

## Project Structure

```
src/
├── app.module.ts          # Main application module
├── main.ts                # Application entry point
├── ping/
│   ├── ping.controller.ts # REST API controller
│   ├── ping.service.ts    # Ping service logic
│   └── ping.module.ts     # Ping module
└── ws/
    └── websocket.gateway.ts # WebSocket gateway (if implemented)
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
- [RxJS](https://rxjs.dev/) - Reactive programming

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

This project is licensed under the UNLICENSED license.
