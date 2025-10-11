# Crypto Wallet Management API

A merchant-oriented API for managing crypto wallets built with Bun, TypeScript, and ElysiaJS.

## Features

- **JWT Authentication**: Secure API key-based authentication with JWT tokens
- **Merchant Profile Management**: View and update merchant profile information
- **Wallet Management**: Create and manage crypto wallets across different networks (Bitcoin, Ethereum, Polygon)
- **Merchant-Scoped Operations**: All operations are scoped to the authenticated merchant
- **Clean Architecture**: Modular structure with services, controllers, and models
- **Type Safety**: Full TypeScript support with strict typing
- **API Documentation**: Auto-generated Swagger documentation
- **Fast Runtime**: Built on Bun for superior performance

## Quick Start

### Prerequisites

- [Bun](https://bun.sh/) installed on your system

### Installation

```bash
# Install dependencies
bun install

# Copy environment variables
cp .env.example .env

# Start development server
bun run dev
```

### Available Scripts

```bash
# Development with hot reload
bun run dev

# Production build
bun run build

# Start production server
bun run start

# Run tests
bun run test
```

## API Endpoints

### Authentication

- `POST /auth/sign` - Authenticate with API key and get JWT token
- `GET /auth/verify` - Verify JWT token validity

### Merchant Profile

- `GET /merchant/profile` - Get authenticated merchant profile
- `PUT /merchant/profile` - Update authenticated merchant profile

### Wallets

- `POST /wallet` - Create a new wallet for the authenticated merchant
- `GET /wallet` - List all wallets for the authenticated merchant
- `GET /wallet/:id` - Get specific wallet by ID (only if it belongs to the authenticated merchant)

## API Documentation

Visit `http://localhost:3000/swagger` when the server is running to see the interactive API documentation.

## Project Structure

```
src/
├── controllers/     # Request handlers and routing
├── services/       # Business logic layer
├── models/         # Data models and database operations
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
├── middleware/     # Custom middleware
└── index.ts        # Application entry point
```

## Example Usage

### 1. Authenticate and Get JWT Token

```bash
curl -X POST http://localhost:3000/auth/sign \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "api-key-merchant-1"
  }'
```

Response:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600
  },
  "message": "Authentication successful"
}
```

### 2. Get Merchant Profile

```bash
curl -X GET http://localhost:3000/merchant/profile \
  -H "Authorization: Bearer <your-jwt-token>"
```

### 3. Create a Wallet

```bash
curl -X POST http://localhost:3000/wallet \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "network": "ethereum"
  }'
```

### 4. List Merchant Wallets

```bash
curl -X GET http://localhost:3000/wallet \
  -H "Authorization: Bearer <your-jwt-token>"
```

## Architecture

This API follows clean architecture principles:

- **Controllers**: Handle HTTP requests and responses
- **Services**: Contain business logic and validation
- **Models**: Manage data persistence and retrieval
- **Types**: Define data structures and interfaces

## Development

The application uses in-memory storage for simplicity. For production use, consider integrating with a database like SQLite, PostgreSQL, or MongoDB.
