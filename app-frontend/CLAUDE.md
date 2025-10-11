# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (start development server)
- **Build**: `npm run build` (create production build)
- **Preview**: `npm run preview` (preview production build)
- **Type checking**: `npm run type-check` or `npm run check` (run TypeScript and Svelte checks)
- **Linting**: `npm run lint` (run ESLint)
- **Formatting**: `npm run format` (format code with Prettier)
- **Full validation**: `npm run validate` (run format check, lint, and type-check)

For fixing issues:
- `npm run lint:fix` - auto-fix ESLint issues
- `npm run format` - auto-format with Prettier  
- `npm run lint:fix-all` - format and fix all issues

## Architecture Overview

This is a SvelteKit application with TypeScript support for a wallet/cryptocurrency management frontend:

### Core Technology Stack
- **SvelteKit** - Full-stack web framework with SSR/SPA capabilities
- **TypeScript** - Type safety throughout the application
- **Tailwind CSS v4** - Utility-first CSS framework with Vite plugin
- **shadcn-svelte** - UI component library for consistent design

### Project Structure
- `/src/lib/` - Reusable library code
  - `/api/` - API service classes (auth, wallets, transactions)
  - `/components/ui/` - Reusable UI components following shadcn patterns
  - `/stores/` - Svelte stores for state management
  - `/types/` - TypeScript type definitions
- `/src/routes/` - File-based routing
  - `/auth/login/` - Authentication pages
  - `/dashboard/` - Protected dashboard area with layout
  - `/dashboard/wallets/` - Wallet management
  - `/dashboard/wallet/[id]/transactions/` - Transaction views

### Key Architectural Patterns

**State Management**: Uses Svelte stores for global state, particularly for authentication (user, isAuthenticated, isLoading stores in `/src/lib/stores/auth.ts`)

**API Layer**: Service classes handle external API communication with consistent error handling and token management (AuthService in `/src/lib/api/auth.ts`)

**Type Safety**: Comprehensive TypeScript interfaces for User, Wallet, Transaction, and API responses in `/src/lib/types/index.ts`

**UI Components**: Follows shadcn design patterns with reusable card, input, button, and form components

**Routing**: Uses SvelteKit's file-based routing with protected routes under `/dashboard/` that require authentication

### Development Notes
- API base URL is configured to `http://localhost:3000/api` in auth service
- Authentication uses JWT tokens stored in localStorage
- The app expects a backend API with endpoints for auth, wallets, and transactions
- Uses Vite for fast development and building
- ESLint and Prettier are configured for code quality