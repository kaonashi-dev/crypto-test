# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a crypto wallet management API built with **Bun**, **ElysiaJS**, **TypeScript**, and **Drizzle ORM**. The API provides merchant-oriented crypto wallet management with JWT authentication and PostgreSQL (Neon) persistence.

## Development Commands

```bash
# Development with hot reload
bun run dev

# Production build and start
bun run build
bun run start

# Testing
bun test

# Database operations
bun run db:generate    # Generate migrations from schema changes
bun run db:migrate     # Run pending migrations
bun run db:push        # Push schema directly to database (dev only)
bun run db:studio      # Open Drizzle Studio for database browsing
bun run db:seed        # Seed database with sample data
bun run db:create-merchant  # Create a new merchant with API credentials
bun run db:reset       # Reset database (migrate + seed)
```

## Architecture

This API follows a clean architecture pattern with the following layers:

### Core Structure
- **Controllers** (`src/controllers/`): HTTP request handlers using ElysiaJS, define routes and validation schemas
- **Services** (`src/services/`): Business logic layer, handles authentication and core operations
- **Models** (`src/models/`): Data access layer using Drizzle ORM
- **Database Schema** (`src/db/schema/`): Drizzle schema definitions with relations
- **Middleware** (`src/middleware/`): Authentication and request processing middleware
- **Types** (`src/types/`): TypeScript type definitions and interfaces

### Key Architectural Patterns

1. **JWT Authentication**: API key authentication exchanges for JWT tokens via `@elysiajs/jwt`
2. **Merchant-scoped operations**: All wallet and transaction operations are scoped to the authenticated merchant
3. **Database migrations**: Automatic schema management with Drizzle migrations
4. **Path aliases**: Uses `@/*` for `src/*` imports (configured in tsconfig.json)
5. **ElysiaJS validation**: All endpoints use Elysia's built-in validation with detailed schemas
6. **Provider Pattern**: Modular blockchain provider system for easy integration with different networks

### Database Schema Relations
- **Merchants**: Core entity with API keys for authentication
- **Wallets**: Belong to merchants, support multiple crypto networks (Bitcoin, Ethereum, Polygon)
- **Transactions**: Linked to wallets, track sends/receives with blockchain transaction data and status

## Framework Specific Guidelines

### Use Bun Instead of Node.js
- `bun <file>` instead of `node <file>`
- `bun test` instead of `jest` or `vitest`
- `bun install` instead of `npm install`
- Environment variables are automatically loaded from `.env`

### ElysiaJS Patterns
- Controllers use `new Elysia({ prefix: '/route' })` pattern
- All endpoints define request/response schemas using `t.Object()`, `t.String()`, etc.
- Authentication uses the `requireAuth` middleware from `src/middleware/auth.ts`
- Swagger documentation auto-generated from schemas

### Database with Drizzle
- Schema files in `src/db/schema/` define tables and relations
- Use `bun run db:generate` after schema changes, then `bun run db:migrate`
- Database connection and migrations handled in `src/db/index.ts` and `src/db/migrate.ts`
- All models use Drizzle ORM syntax with prepared statements for performance

### Authentication Flow
1. Exchange merchant credentials for JWT via `POST /auth/token`
   - Send `X-Merchant-ID` header with your merchant ID
   - Send `Merchant-Secret` header with your merchant secret
2. Include JWT as `Bearer` token in `Authorization` header
3. Protected routes use `requireAuth` middleware which populates `user` context
4. All operations automatically scoped to authenticated merchant

## Environment Setup

Required environment variables (see `.env.example`):
- `DATABASE_URL`: Neon PostgreSQL connection string
- `JWT_SECRET`: Secret for signing JWT tokens
- `NODE_ENV`: Environment mode (development/production)
- `PORT`: Server port (defaults to 3000)

## API Structure

- **Authentication**: `/auth/token` - Exchange merchant credentials for JWT token
- **Merchant Profile**: `/merchant/profile` (GET/PUT) - Manage merchant information
- **Wallet Management**: `/wallet` (POST/GET), `/wallet/:id` (GET) - Create and manage crypto wallets
- **Transaction Management**: `/transaction` (POST/GET), `/transaction/:txHash` (GET), `/transaction/wallet/:walletId` (GET) - Create and track blockchain transactions
- **Currency Management**: `/currencies` (GET), `/currencies/:id` (GET) - Retrieve supported currencies and networks
- **Exchange Rates**: `/exchange-rates` (GET/POST/PUT/DELETE) - Manage currency exchange rates and conversions
- **Health Check**: `/health` - API health status
- **API Documentation**: `/swagger` - Interactive API documentation

All authenticated endpoints require `Authorization: Bearer <jwt-token>` header.

### Transaction System Features

- **Multi-Network Support**: Bitcoin, Ethereum, and Polygon networks
- **Transaction Types**: Send (outgoing) and Receive (tracking incoming) transactions
- **Real-time Status**: Automatic blockchain status checking and updates
- **Provider Integration**: Modular system for blockchain provider integration
- **Security**: Merchant-scoped access, address validation, and secure transaction processing
